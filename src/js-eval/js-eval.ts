import { CompileV2 } from '../compiler/types';
import {
  Binding,
  BindingType,
  Environment,
  get_all_from_environment,
  get_binding,
  install_bindings,
  lookup_binding,
  make_empty_bindings,
  make_env_list,
  set_binding,
  set_define,
  set_syntax,
} from '../environment';
import { apply } from '../evaluator';
import { EvalDataType } from '../evaluator/datatypes';
import {
  Apply,
  EvalErr,
  EvalResult,
  EvalSExpr,
  EvaluateExprOrDefine,
  EvaluateModule,
} from '../evaluator/types';
import {
  Begin0Form,
  BeginForm,
  DefineForm,
  DefineSyntaxForm,
  ExprForm,
  ExprOrDefineAst,
  ExprOrDefineForm,
  IfForm,
  LetForm,
  LetrecForm,
  ModuleAst,
  PlainAppForm,
  PlainLambdaForm,
  ProvideForm,
  QuoteForm,
  RequireForm,
  SetForm,
  StatementForm,
  VariableReferenceForm,
} from '../fep-types';
import { EvaluatorHost, FileName } from '../host';
import { Module } from '../modules';
import { extract_matches, match, read_pattern } from '../pattern';
import { print } from '../printer';
import { read } from '../reader';
import {
  is_list,
  is_symbol,
  SExpr,
  SExprT,
  SHomList,
  slist,
  snil,
  ssymbol,
  SSymbol,
  STypes,
  val,
} from '../sexpr';
import { err, getOk, isBadResult, ok, Result } from '../utils';

type JsExprProgram = string;
type JsEvalableProgram = string;

const name_directory: Map<string, string> = new Map();
const reverse_name_directory: Map<string, string> = new Map();

export function escape_name(name: string): string {
  if (name_directory.has(name)) {
    return name_directory.get(name)!;
  }
  let safe_name = name;

  // Common symbols
  // safe_name = safe_name.replace(/[+]/g, '_plus_');
  // safe_name = safe_name.replace(/[-]/g, '_dash_');
  // safe_name = safe_name.replace(/[*]/g, '_star_');
  // safe_name = safe_name.replace(/[/]/g, '_slash_');
  // safe_name = safe_name.replace(/[%]/g, '_percent_');
  // safe_name = safe_name.replace(/[#]/g, '_pound_');
  // safe_name = safe_name.replace(/[!]/g, '_bang_');
  // safe_name = safe_name.replace(/[?]/g, '_wat_');
  // safe_name = safe_name.replace(/[<]/g, '_left_');
  // safe_name = safe_name.replace(/[>]/g, '_right_');
  // safe_name = safe_name.replace(/[=]/g, '_equal_');

  // Nuke any remaining non-safe stuff
  safe_name = safe_name.replace(/[^a-zA-Z_0-9]/g, '');
  safe_name = safe_name + '_'; // don't clash with any js keywords, numbers now safe
  while (reverse_name_directory.has(safe_name)) {
    safe_name = safe_name + '_';
  }

  reverse_name_directory.set(safe_name, name);
  name_directory.set(name, safe_name);
  return safe_name;
}

export function compile_js_expr_to_evalable(
  js: JsExprProgram,
  environment: Environment
): [[string, Binding][], JsEvalableProgram] {
  const name_and_bindings = [...get_all_from_environment(environment)];
  const program = [];
  // a utility to ensure we don't try to read from undefined
  program.push(`
    function assertDefined(v) {
      if (v === undefined) {
        throw 'tried to use undefined value';
        } else {
        return v;
      }
    }

    function array_to_list(arr) {
      let result = { _type: 3 }; // nil
      for (let i = arr.length - 1; i >= 0; i--) {
        result = { _type: 4, x: arr[i], y: result };
      }
      return result;
    }

    function is_not_false(sexpr) {
      return sexpr._type !== 2 || sexpr.val !== false;
    }

    function begin(...args) {
      return args[args.length - 1];
    }
    function begin0(...args) {
      return args[0];
    }
    `);

  // Load bindings into env
  program.push('function evaler(\n        ');
  const names_to_load = [];
  // We need certain builtins for anything to work at all.
  // This one's needed so we can call both closures and primitive functions
  names_to_load.push('apply');
  names_to_load.push('read');
  for (const [n, b_] of name_and_bindings) {
    if (name_directory.has(n)) {
      names_to_load.push('variable_' + escape_name(n));
    }
  }
  for (const [n, b_] of name_and_bindings) {
    if (name_directory.has(n)) {
      names_to_load.push('binding_type_' + escape_name(n));
    }
  }
  program.push(names_to_load.join(',\n        '));
  program.push('\n) {\n');

  // We're evaluating defines or exprs
  // This means we need to handle when new stuff get added to the innermost environment.
  // That stuff goes in exports.
  program.push('const exports = new Map();\n');

  // the actual program is either an expression or an IIFE, so we can get its result
  program.push('\n'.repeat(10));
  program.push(`const result = ${js};\n`);
  program.push('\n'.repeat(10));

  // load the current values back into exports
  program.push('const new_values = new Map();\n');
  for (const [n, b] of name_and_bindings) {
    if (name_directory.has(n)) {
      if (b._type === BindingType.Define) {
        program.push(`new_values.set(\`${n}\`, variable_${escape_name(n)});\n`);
      }
    }
    // Don't touch the syntaxes and cores we were given.
  }

  // return the exports and results,
  // and we'll do the processing after the eval to add the exports to the environment
  program.push('return [exports, new_values, result];');
  program.push('}\n');

  // return the evaler
  program.push('return evaler;');

  const js_program = ''.concat(...program);
  return [name_and_bindings, js_program];
}

export function eval_js_expr_in_env(
  js: JsExprProgram,
  environment: Environment
): Result<EvalSExpr, EvalErr> {
  // We need to finish up some "last minute compilation"
  // that loads the symbols in the environment into our code.

  const [name_and_bindings, js_program] = compile_js_expr_to_evalable(js, environment);

  const evaler: (
    apply: (fun: EvalSExpr, ...args: EvalSExpr[]) => EvalSExpr,
    read: (e: string) => SExpr,
    ...variables: (SExprT<unknown> | undefined | CompileV2 | BindingType)[]
  ) => [Map<string, [BindingType, EvalSExpr]>, Map<string, EvalSExpr>, EvalSExpr] = Function(
    js_program
  )();

  // call the evaler with all the right values
  try {
    const [exports, new_values, result] = evaler(
      (f, ...x) => {
        const result = apply(f, ...x);
        if (result.good) {
          return result.v;
        } else {
          throw result.err.toString();
        }
      },
      (e: string) => getOk(read(e)),
      ...name_and_bindings
        .filter(([n, b_]) => name_directory.has(n))
        .map(([n_, b]) =>
          b._type === BindingType.Define || b._type === BindingType.Syntax ? b.val : b.fun
        ),
      ...name_and_bindings.filter(([n, b_]) => name_directory.has(n)).map(([n_, b]) => b._type)
    );
    // set up the parts of the environment they changed
    for (const [name, [binding_type, value]] of exports) {
      if (environment !== undefined) {
        if (binding_type === BindingType.Define) {
          set_define(environment.bindings, name, value);
        } else if (binding_type === BindingType.Syntax) {
          set_syntax(environment.bindings, name, value);
        } else if (binding_type === BindingType.Core) {
          throw 'unreachable';
        } else {
          throw 'unreachable';
        }
      } else {
        throw 'tried to set value when there is no environment';
      }
    }
    for (const [name, value] of new_values) {
      if (environment !== undefined) {
        const b = lookup_binding(name, environment)!;
        if (b._type === BindingType.Define || b._type === BindingType.Syntax) {
          b.val = value;
        } else {
          b.fun = (value as unknown) as CompileV2;
        }
      } else {
        throw 'tried to set value when there is no environment';
      }
    }

    return ok(result);
  } catch (e) {
    return err(e.toString());
  }
}

// We will always compile to expressions.
// If we need a statement,
// we will compile an immediately invoked function expression (IIFE)
// This is slow, but simplifies the design.
// IIFEs look like this:
//   ( () => { statements go here ... } )()
// Note how this construct lets us run statements from within expressions.

const compile_cache: Map<ExprOrDefineAst, string> = new Map();

export function compile_expr_or_define_to_js_expr(program: ExprOrDefineAst): JsExprProgram {
  if (compile_cache.has(program)) {
    return compile_cache.get(program)!;
  }
  const result = ''.concat(...compile_expr_or_define_to_strings(program));
  compile_cache.set(program, result);
  return result;
}

const module_cache: Map<string, [RequireForm[], JsExprProgram]> = new Map();

export function compile_module_to_js_expr(
  program_str: string,
  filename: string
): [RequireForm[], JsExprProgram] {
  if (module_cache.has(program_str)) {
    return module_cache.get(program_str)!;
  }
  const program = getOk(read(program_str)) as ModuleAst;
  const [requires, strings] = compile_module_to_strings(program, filename);
  const result = ''.concat(...strings);
  module_cache.set(program_str, [requires, result])!;
  return [requires, result];
}

function scan_defines(
  body: SHomList<StatementForm>,
  defines: [string, BindingType][] = []
): [string, BindingType][] {
  while (is_list(body)) {
    const statement = body.x;
    body = body.y;
    switch (statement.x.val) {
      case 'define': {
        defines.push([(statement as DefineForm).y.x.val, BindingType.Define]);
        break;
      }
      case 'define-syntax': {
        defines.push([(statement as DefineSyntaxForm).y.x.val, BindingType.Syntax]);
        break;
      }
      case 'begin': {
        scan_defines((statement as BeginForm).y, defines);
        break;
      }
    }
  }
  return defines;
}

function compile_expr_or_define_to_strings(
  program: ExprOrDefineAst,
  strings: string[] = []
): string[] {
  const token_val = program.x.val;
  switch (token_val) {
    case '#%plain-lambda': {
      const this_program = program as PlainLambdaForm;
      const param_names = [];
      let rest_name: string | undefined = undefined;
      const definitions = scan_defines(this_program.y.y);
      {
        let formals = this_program.y.x;
        while (is_list(formals)) {
          param_names.push(`variable_${escape_name(formals.x.val)}`);
          formals = formals.y;
        }
        if (is_symbol(formals)) {
          rest_name = `variable_${escape_name(formals.val)}`;
        }
      }
      strings.push(`({ _type: ${STypes.Boxed}, val: { variant: ${EvalDataType.Primitive}, fun: (`);
      if (rest_name !== undefined) {
        strings.push([...param_names, '...' + rest_name].join(', '));
      } else {
        strings.push([...param_names, '...extra'].join(', '));
      }
      // We need to intercept attempts to export stuff because this introduces a new environment.
      strings.push(') => {\nconst exports = { set: (x) => x };\n');
      for (const param of param_names) {
        strings.push(
          `if (${param} === undefined) { return ({ good: false, v: undefined, err: 'too few arguments given' }); }\n`
        );
      }
      if (rest_name !== undefined) {
        strings.push(`${rest_name} = array_to_list(${rest_name});\n`);
      } else {
        strings.push(
          `if (extra.length > 0) { return ({ good: false, v: undefined, err: 'too many arguments given' }); }\n`
        );
      }
      for (const [name, binding_type] of definitions) {
        strings.push('let variable_', escape_name(name), ' = undefined;\n');
        strings.push('let binding_type_', escape_name(name), ' = ', binding_type.toString(), ';\n');
      }

      strings.push('let result = undefined');
      {
        let body: SHomList<ExprOrDefineForm> = this_program.y.y;
        while (is_list(body)) {
          strings.push(';\nresult = ');
          compile_expr_or_define_to_strings(body.x, strings);
          body = body.y;
        }
      }
      strings.push(';\nreturn ({ good: true, v: result, err: undefined });\n} } })');
      return strings;
    }

    case 'if': {
      const this_program = program as IfForm;
      strings.push('(is_not_false(');
      compile_expr_or_define_to_strings(this_program.y.x, strings);
      strings.push(') \n? ');
      compile_expr_or_define_to_strings(this_program.y.y.x, strings);
      strings.push('\n: ');
      compile_expr_or_define_to_strings(this_program.y.y.y.x, strings);
      strings.push(')');
      return strings;
    }

    case 'begin': {
      const this_program = program as BeginForm;
      // dummy value to simplify printing, lol
      strings.push('begin(');
      {
        let body: SHomList<ExprOrDefineForm> = this_program.y;
        compile_expr_or_define_to_strings(body.x, strings);
        body = body.y;
        while (is_list(body)) {
          strings.push(',\n');
          compile_expr_or_define_to_strings(body.x, strings);
          body = body.y;
        }
      }
      strings.push(')');
      return strings;
    }

    case 'begin0': {
      const this_program = program as Begin0Form;
      // dummy value to simplify printing, lol
      strings.push('begin0(');
      {
        let body: SHomList<ExprOrDefineForm> = this_program.y;
        compile_expr_or_define_to_strings(body.x, strings);
        body = body.y;
        while (is_list(body)) {
          strings.push(',\n');
          compile_expr_or_define_to_strings(body.x, strings);
          body = body.y;
        }
      }
      strings.push(')');
      return strings;
    }

    case 'let': {
      const this_program = program as LetForm;
      const names = [];
      const values = [];
      {
        let defins = this_program.y.x;
        while (is_list(defins)) {
          names.push('variable_' + escape_name(defins.x.x.val));
          values.push(defins.x.y.x);
          defins = defins.y;
        }
      }
      {
        let defins = this_program.y.x;
        while (is_list(defins)) {
          names.push('binding_type_' + escape_name(defins.x.x.val));
          defins = defins.y;
        }
      }
      strings.push('((dummy');
      for (const n of names) {
        strings.push(', ');
        strings.push(n);
      }
      strings.push(') => begin(undefined');
      {
        let body: SHomList<ExprForm> = this_program.y.y;
        while (is_list(body)) {
          strings.push(',\n');
          compile_expr_or_define_to_strings(body.x, strings);
          body = body.y;
        }
      }
      strings.push('))(undefined');
      for (const v of values) {
        strings.push(',\n');
        compile_expr_or_define_to_strings(v, strings);
      }
      for (const v_ of values) {
        strings.push(',\n');
        strings.push(BindingType.Define.toString());
      }
      strings.push(')');
      return strings;
    }

    case 'letrec': {
      const this_program = program as LetrecForm;
      strings.push('(() => { undefined');
      {
        let defins = this_program.y.x;
        while (is_list(defins)) {
          strings.push('; const variable_' + escape_name(defins.x.x.val) + ' = ');
          compile_expr_or_define_to_strings(defins.x.y.x, strings);
          strings.push('; const binding_type_' + escape_name(defins.x.x.val) + ' = ');
          strings.push(BindingType.Define.toString());
          defins = defins.y;
        }
      }
      strings.push(';\nreturn begin(undefined');
      {
        let body: SHomList<ExprForm> = this_program.y.y;
        while (is_list(body)) {
          strings.push(',\n');
          compile_expr_or_define_to_strings(body.x, strings);
          body = body.y;
        }
      }
      strings.push('); })()');
      return strings;
    }

    case 'quote': {
      const this_program = program as QuoteForm;
      const quoted = this_program.y.x;
      const as_string = print(quoted);
      strings.push('read(`', as_string, '`)');
      return strings;
    }

    case '#%plain-app': {
      const this_program = program as PlainAppForm;
      const f = this_program.y.x;
      strings.push('apply(');
      compile_expr_or_define_to_strings(f, strings);
      {
        let args = this_program.y.y;
        while (is_list(args)) {
          strings.push(', ');
          compile_expr_or_define_to_strings(args.x, strings);
          args = args.y;
        }
      }
      strings.push(')');
      return strings;
    }

    case '#%variable-reference': {
      const this_program = program as VariableReferenceForm;
      const varname = this_program.y.x.val;
      strings.push('variable_' + escape_name(varname));
      return strings;
    }

    case 'set!': {
      const this_program = program as SetForm;
      const varname = this_program.y.x.val;
      const value = this_program.y.y.x;
      strings.push('(variable_' + escape_name(varname) + ' = ');
      compile_expr_or_define_to_strings(value, strings);
      strings.push(')');
      return strings;
    }

    case 'define': {
      const this_program = program as DefineForm;
      const varname = this_program.y.x.val;
      const value = this_program.y.y.x;
      strings.push('begin0(variable_' + escape_name(varname) + ' = ');
      compile_expr_or_define_to_strings(value, strings);
      strings.push(
        ', exports.set(`',
        varname,
        '`, [',
        BindingType.Define.toString(),
        ', variable_',
        escape_name(varname),
        ']))'
      );
      return strings;
    }

    case 'define-syntax': {
      const this_program = program as DefineSyntaxForm;
      const varname = this_program.y.x.val;
      const value = this_program.y.y.x;
      strings.push('begin0(variable_' + escape_name(varname) + ' = ');
      compile_expr_or_define_to_strings(value, strings);
      strings.push(
        ', exports.set(`',
        varname,
        '`, [',
        BindingType.Syntax.toString(),
        ', variable_',
        escape_name(varname),
        ']))'
      );
      return strings;
    }
  }
}

function compile_module_to_strings(
  program: ModuleAst,
  filename: string
): [RequireForm[], string[]] {
  let module_body: SHomList<StatementForm> = program.y.y.y.x.y;

  const module_name = program.y.x.val;
  const module_path = program.y.y.x;

  const requires: RequireForm[] = [];
  const provides: ProvideForm[] = [];

  requires.push(slist([ssymbol('#%require'), module_path] as const, snil()));

  const output: string[] = [];

  output.push('(() => {\n');

  // Introduce new scope
  // Don't use a dummy map for exports, we need to see the type of binding when we provide them
  output.push('const exports = new Map();\n');
  const definitions = scan_defines(module_body);
  for (const [name, binding_type] of definitions) {
    output.push('let variable_', escape_name(name), ' = undefined;\n');
    output.push('let binding_type_', escape_name(name), ' = ', binding_type.toString(), ';\n');
  }

  while (is_list(module_body)) {
    const statement = module_body.x;
    module_body = module_body.y;

    const token_val = statement.x.val;
    switch (token_val) {
      case '#%require': {
        requires.push(statement as RequireForm);
        break;
      }

      case '#%provide': {
        provides.push(statement as ProvideForm);
        break;
      }

      default: {
        compile_expr_or_define_to_strings(statement as ExprOrDefineForm, output);
        output.push(';\n\n');
        break;
      }
    }
  }

  // We've intercepted all the defines, we now prepare the provides using that

  const provide_names: [string, string][] = [];
  for (const provide_form of provides) {
    let export_specs = provide_form.y;
    while (is_list(export_specs)) {
      const spec = export_specs.x;
      export_specs = export_specs.y;
      {
        const rename_match_result = match(spec, getOk(read_pattern("('rename local exported)")));
        if (rename_match_result !== undefined) {
          extract_matches(rename_match_result, (local: [SSymbol], exported: [SSymbol]) =>
            provide_names.push([val(local[0]), val(exported[0])])
          );
          continue;
        }
      }
      {
        const rename_match_result = match(spec, getOk(read_pattern('sym-name')));
        if (rename_match_result !== undefined) {
          extract_matches(rename_match_result, (name: [SSymbol]) =>
            provide_names.push([val(name[0]), val(name[0])])
          );
          continue;
        }
      }
    }
  }

  output.push(`const provides = new Map();\n`);

  for (const [name, exported] of provide_names) {
    output.push(`
      {
        const binding_value = variable_${escape_name(name)};
        if (binding_value === undefined) {
          throw \`tried to provide ${name} but it was not defined\`;
        }
        const binding_type = binding_type_${escape_name(name)};
        if (binding_type !== ${BindingType.Core}) {
          provides.set(\`${exported}\`, { _type: binding_type, val: binding_value });
        } else {
          provides.set(\`${exported}\`, { _type: binding_type, fun: binding_value });
        }
      }`);
  }

  output.push(
    `\n\nconst output_module = { name: \`${module_name}\`, filename: \`${filename}\`, provides: provides };\n`,
    'return output_module;\n})()'
  );

  return [requires, output];
}

export const js_transpile_run_expr_or_define: EvaluateExprOrDefine = (
  program: ExprOrDefineAst,
  env: Environment
): EvalResult => {
  const js_expr = compile_expr_or_define_to_js_expr(program);

  return eval_js_expr_in_env(js_expr, env);
};

export const js_transpile_run_module: EvaluateModule = (
  program_str: string,
  program_filename: FileName,
  host: EvaluatorHost
): Result<Module, EvalErr> => {
  const [requires, compiled_module] = compile_module_to_js_expr(program_str, program_filename);

  const env = make_env_list(make_empty_bindings());

  for (const req of requires) {
    let specs = req.y;
    while (is_list(specs)) {
      const spec = specs.x;
      specs = specs.y;
      {
        const match_result = match(spec, getOk(read_pattern('sym-name')));
        if (match_result !== undefined) {
          const module_name = extract_matches(match_result, (name: [SSymbol]) => val(name[0]));
          // compile required module
          const module_r = host.read_fep_module(module_name, program_filename);
          if (isBadResult(module_r)) {
            return err(`evaluate_module (#%require): error while requiring module ${module_name}`);
          }
          install_bindings(env.bindings, module_r.v.provides);
          continue;
        }
      }
      {
        const match_result = match(spec, getOk(read_pattern("('quote sym-name)")));
        if (match_result !== undefined) {
          const module_name = extract_matches(match_result, (name: [SSymbol]) => val(name[0]));
          const module_r = host.read_builtin_module(module_name);
          if (isBadResult(module_r)) {
            return err(
              `evaluate_module (#%require): error while requiring builtin module ${module_name}`
            );
          }
          install_bindings(env.bindings, module_r.v.provides);
          continue;
        }
      }
      {
        const match_result = match(
          spec,
          getOk(read_pattern("('rename sym-name sym-local sym-exported)"))
        );
        if (match_result !== undefined) {
          const [module_name, local, exported] = extract_matches(
            match_result,
            (name: [SSymbol], local: [SSymbol], exported: [SSymbol]) => [
              val(name[0]),
              val(local[0]),
              val(exported[0]),
            ]
          );
          // compile required module
          const module_r = host.read_fep_module(module_name, program_filename);
          if (isBadResult(module_r)) {
            return err(`evaluate_module (#%require): error while requiring module ${module_name}`);
          }
          const binding = get_binding(module_r.v.provides, local);
          if (binding === undefined) {
            return err(
              `evaluate_module (#%require): binding ${local} not exported in module ${module_name}`
            );
          }
          set_binding(env.bindings, exported, binding);
          continue;
        }
      }
      {
        const match_result = match(
          spec,
          getOk(read_pattern("('rename ('quote sym-name) sym-local sym-exported)"))
        );
        if (match_result !== undefined) {
          const [module_name, local, exported] = extract_matches(
            match_result,
            (name: [SSymbol], local: [SSymbol], exported: [SSymbol]) => [
              val(name[0]),
              val(local[0]),
              val(exported[0]),
            ]
          );
          const module_r = host.read_builtin_module(module_name);
          if (isBadResult(module_r)) {
            return err(`evaluate_module (#%require): error while requiring module ${module_name}`);
          }
          const binding = get_binding(module_r.v.provides, local);
          if (binding === undefined) {
            return err(
              `evaluate_module (#%require): binding ${local} not exported in module ${module_name}`
            );
          }
          set_binding(env.bindings, exported, binding);
          continue;
        }
      }
    }
  }

  const result = eval_js_expr_in_env(compiled_module, env) as Result<Module, string>;
  return result;
};
