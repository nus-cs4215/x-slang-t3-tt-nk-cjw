import {
  find_env,
  get_syntax,
  has_syntax,
  make_empty_bindings,
  make_env,
  make_env_list,
  NonemptyEnvironment,
  set_define,
  set_syntax,
} from '../environment';
import { apply_syntax, evaluate, evaluate_module } from '../evaluator';
import { EvalData } from '../evaluator/datatypes';
import {
  DefineForm,
  DefineSyntaxForm,
  FEExpr,
  IfForm,
  LetForm,
  LetrecForm,
  ModuleBuiltinParentForm,
  ModuleLevelForm,
  QuoteForm,
  TopLevelForm,
  VariableReferenceForm,
} from '../fep-types';
import { Module } from '../modules';
import {
  extract_matches,
  json_plus,
  json_star,
  json_symvar,
  json_var,
  match,
  MatchObject,
} from '../pattern';
import { print } from '../printer';
import { read } from '../reader';
import {
  car,
  cdr,
  is_list,
  is_nil,
  is_symbol,
  jsonRead,
  SCons,
  scons,
  SExpr,
  SExprT,
  slist,
  SList,
  SNil,
  snil,
  SSymbol,
  ssymbol,
  val,
} from '../sexpr';
import { err, isBadResult, isGoodResult, map_results, ok, Result, then } from '../utils';
import { CompilerHost, FileContents, FileName } from './compiler-host';
import { CompileModule, CompileErr, CompileModuleResultV, Compile, CompileResultV } from './types';

function noop_expr_transformer(
  expr: SList<never> | SSymbol,
  compile_env_: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  return ok(expr as FEExpr);
}

function noop_statement_transformer(
  statement: SList<never>,
  compile_env_: NonemptyEnvironment,
  output_statements: ModuleLevelForm[]
): Result<[], CompileErr> {
  output_statements.push(statement as ModuleLevelForm);
  return ok([]);
}

const define_pattern = jsonRead(['define', json_symvar('name'), json_var('value')]);
function define(
  expr: SList<never>,
  compile_env: NonemptyEnvironment,
  output_statements: ModuleLevelForm[]
): Result<[], CompileErr> {
  const match_result = match(expr, define_pattern);
  if (match_result !== undefined) {
    const {
      name: [name_expr],
      value: [value_expr],
    } = match_result as MatchObject<never> & { name: [SSymbol] };
    const expanded_value_result = expand_in_expression_context(value_expr, compile_env);
    if (isBadResult(expanded_value_result)) {
      return expanded_value_result;
    }
    const expanded_value = expanded_value_result.v;

    // Register the bindings, but it's a define so we don't need to evaluate it
    set_define(compile_env.bindings, val(name_expr), undefined);
    // Finally create the define form
    const define_form: DefineForm = slist(
      [ssymbol('define'), name_expr, expanded_value] as const,
      snil()
    );
    output_statements.push(define_form);
    return ok([]);
  } else {
    return err('did not match form for define');
  }
}

const define_syntax_pattern = jsonRead(['define-syntax', json_symvar('name'), json_var('value')]);
function define_syntax(
  expr: SList<never>,
  compile_env: NonemptyEnvironment,
  output_statements: ModuleLevelForm[]
): Result<[], CompileErr> {
  const match_result = match(expr, define_syntax_pattern);
  if (match_result !== undefined) {
    const {
      name: [name_expr],
      value: [value_expr],
    } = match_result as MatchObject<never> & { name: [SSymbol] };
    const expanded_value_result = expand_in_expression_context(value_expr, compile_env);
    if (isBadResult(expanded_value_result)) {
      return expanded_value_result;
    }
    const expanded_value = expanded_value_result.v;

    // evaluate and register the binding
    const evaluate_result = evaluate(expanded_value, compile_env);
    if (isBadResult(evaluate_result)) {
      return evaluate_result;
    }
    set_syntax(compile_env.bindings, val(name_expr), evaluate_result.v);
    // Finally create the define form
    const define_syntax_form: DefineSyntaxForm = slist(
      [ssymbol('define-syntax'), name_expr, expanded_value] as const,
      snil()
    );
    output_statements.push(define_syntax_form);
    return ok([]);
  } else {
    return err('did not match form for define-syntax');
  }
}

const if_pattern = jsonRead([
  'if',
  json_var('condition'),
  json_var('consequent'),
  json_var('alternate'),
]);
function if_(
  expr: SList<never> | SSymbol,
  compile_env: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  if (is_symbol(expr)) {
    return err('if is a reserved keyword, and cannot be used as a variable');
  }
  const match_result = match(expr, if_pattern);
  if (match_result === undefined) {
    return err();
  }
  const {
    condition: [condition],
    consequent: [consequent],
    alternate: [alternate],
  } = match_result;
  const expanded_result: Result<[FEExpr, FEExpr, FEExpr], CompileErr> = map_results(
    (e) => expand_in_expression_context(e, compile_env),
    [condition, consequent, alternate] as SExpr[]
  ) as any;
  if (isBadResult(expanded_result)) {
    return err();
  }
  const if_form: IfForm = slist([ssymbol('if'), ...expanded_result.v] as const, snil());
  return ok(if_form);
}

const let_pattern = jsonRead([
  'let',
  json_star([json_symvar('ids'), json_var('values')], []),
  '.',
  json_plus(json_var('body'), []),
]);
function let_(
  expr: SList<never> | SSymbol,
  compile_env: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  if (is_symbol(expr)) {
    return err('let is a reserved keyword, and cannot be used as a variable');
  }
  const match_result = match(expr, let_pattern);
  if (match_result === undefined) {
    return err();
  }

  return extract_matches(match_result, (ids: SSymbol[], values: SExpr[], body: SExpr[]) => {
    if (ids.length === 0) {
      // Let with no bindings is the same as body
      const expanded_body_result: Result<FEExpr[], CompileErr> = map_results(
        (e) => expand_in_expression_context(e, compile_env),
        body
      );
      if (isBadResult(expanded_body_result)) {
        return err();
      }
      return ok(slist([ssymbol('begin'), ...expanded_body_result.v] as const, snil()));
    }
    const id_value_pairs: SCons<SSymbol, SCons<FEExpr, SNil>>[] = [];
    for (let i = 0; i < ids.length; i++) {
      const expanded_body_expr_result = expand_in_expression_context(values[i], compile_env);
      if (isBadResult(expanded_body_expr_result)) {
        return err();
      }
      id_value_pairs.push(slist([ids[i], expanded_body_expr_result.v] as const, snil()));
    }
    const expanded_body_result: Result<FEExpr[], CompileErr> = map_results(
      (e) => expand_in_expression_context(e, compile_env),
      body
    );
    if (isBadResult(expanded_body_result)) {
      return err();
    }
    const let_form: LetForm = slist(
      [ssymbol('let'), slist(id_value_pairs, snil()), ...expanded_body_result.v] as const,
      snil()
    );
    return ok(let_form);
  });
}

const letrec_pattern = jsonRead([
  'letrec',
  json_star([json_symvar('ids'), json_var('values')], []),
  '.',
  json_plus(json_var('body'), []),
]);
function letrec(
  expr: SList<never> | SSymbol,
  compile_env: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  if (is_symbol(expr)) {
    return err('letrec is a reserved keyword, and cannot be used as a variable');
  }
  const match_result = match(expr, letrec_pattern) as MatchObject<never> & { ids: SSymbol[] };
  if (match_result === undefined) {
    return err();
  }
  return extract_matches(match_result, (ids: SSymbol[], values: SExpr[], body: SExpr[]) => {
    if (ids === undefined) {
      // Let with no bindings is the same as body
      const expanded_body_result: Result<FEExpr[], CompileErr> = map_results(
        (e) => expand_in_expression_context(e, compile_env),
        body
      );
      if (isBadResult(expanded_body_result)) {
        return err();
      }
      return ok(slist([ssymbol('begin'), ...expanded_body_result.v] as const, snil()));
    }
    const id_value_pairs: SCons<SSymbol, SCons<FEExpr, SNil>>[] = [];
    for (let i = 0; i < ids.length; i++) {
      const expanded_body_expr_result = expand_in_expression_context(values[i], compile_env);
      if (isBadResult(expanded_body_expr_result)) {
        return err();
      }
      id_value_pairs.push(slist([ids[i], expanded_body_expr_result.v] as const, snil()));
    }
    const expanded_body_result: Result<FEExpr[], CompileErr> = map_results(
      (e) => expand_in_expression_context(e, compile_env),
      body
    );
    if (isBadResult(expanded_body_result)) {
      return err();
    }
    const letrec_form: LetrecForm = slist(
      [ssymbol('letrec'), slist(id_value_pairs, snil()), ...expanded_body_result.v] as const,
      snil()
    );
    return ok(letrec_form);
  });
}

function begin(
  expr: SList<never>,
  compile_env_: NonemptyEnvironment,
  output_statements_: ModuleLevelForm[]
): Result<SExpr[], CompileErr> {
  // remove begin/#%plain-module-begin/etc
  let body = cdr(expr);
  const statements: SExpr[] = [];
  while (is_list(body)) {
    statements.push(car(body));
    body = cdr(body);
  }
  if (!is_nil(body)) {
    return err('begin forms must be proper');
  }
  return ok(statements);
}

function plain_app_expr(
  expr: SList<never> | SSymbol,
  compile_env: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  if (is_symbol(expr)) {
    return err('#%plain-app is a reserved keyword and cannot be used as a variable');
  }
  // recursively compile all the terms in the app
  // then we add #%plain-app
  const app_terms: FEExpr[] = [];
  // remove #%plain-app
  let body = cdr(expr as SList<never>);
  while (is_list(body)) {
    const expanded_term_result = expand_in_expression_context(car(body), compile_env);
    body = cdr(body);
    if (isBadResult(expanded_term_result)) {
      return err('error expanding body of #%plain-app');
    }
    app_terms.push(expanded_term_result.v);
  }
  if (!is_nil(body)) {
    return err('#%plain-app should be proper list');
  }
  return ok(slist([ssymbol('#%plain-app'), ...app_terms] as const, snil()));
}

function plain_app_statement(
  expr: SList<never>,
  compile_env: NonemptyEnvironment,
  output_statements: ModuleLevelForm[]
): Result<[], CompileErr> {
  return then(plain_app_expr(expr, compile_env), (expanded_expr) => {
    output_statements.push(expanded_expr);
    return ok([]);
  });
}

function quote_expr(
  expr: SList<never> | SSymbol,
  compile_env__: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  if (is_symbol(expr)) {
    return err('quote is a reserved keyword and cannot be used as a variable');
  }
  // Check there's exactly 1 arg
  if (!(is_list(cdr(expr)) && is_nil(cdr(cdr(expr) as SList<never>)))) {
    return err('quote should be a proper list containing exactly 1 argument');
  }
  // Then we just output input unchanged
  return ok(expr as QuoteForm);
}

function quote_statement(
  expr: SList<never>,
  compile_env: NonemptyEnvironment,
  output_statements: ModuleLevelForm[]
): Result<[], CompileErr> {
  return then(quote_expr(expr, compile_env), (expanded_expr) => {
    output_statements.push(expanded_expr);
    return ok([]);
  });
}

const core_expression_form_transformers: Map<
  string,
  (expr: SList<never> | SSymbol, compile_env: NonemptyEnvironment) => Result<FEExpr, CompileErr>
> = new Map([
  ['#%plain-app', plain_app_expr],
  ['#%variable-reference', noop_expr_transformer],
  ['quote', quote_expr],
  ['#%plain-lambda', noop_expr_transformer],
  ['if', if_],
  ['let', let_],
  ['letrec', letrec],
  // ['define', define],
  // ['define-syntax', define_syntax],
]);

const core_statement_form_transformers: Map<
  string,
  (
    expr: SList<never>,
    compile_env: NonemptyEnvironment,
    output_statements: ModuleLevelForm[]
  ) => Result<SExpr[], CompileErr>
> = new Map([
  ['#%plain-app', plain_app_statement],
  ['#%variable-reference', noop_statement_transformer],
  ['quote', quote_statement],
  ['#%plain-lambda', noop_statement_transformer],
  ['define', define],
  ['define-syntax', define_syntax],
  ['#%plain-module-begin', begin],
  ['begin', begin],
]);

const module_pattern = jsonRead([
  'module',
  json_var('module_name'),
  json_var('module_path'),
  '.',
  json_star(json_var('body'), []),
]);
const quoted_module_path_pattern = jsonRead(['quote', json_var('module_path')]);
interface ModuleInfo {
  name: string;
  // true means the module_path matches (quote ...)
  module_path_is_builtin: boolean;
  module_path_name: string;
  module_body: SExpr[];
}

function get_module_info(program: SExpr): Result<ModuleInfo, CompileErr> {
  const match_result = match(program, module_pattern);
  if (match_result === undefined) {
    // It failed to match
    return err("expected module form but it didn' match pattern");
  }
  const {
    module_name: [module_name_sexpr],
    module_path: [module_path_sexpr],
    body: module_body_or_undefined,
  } = match_result;
  const module_body = module_body_or_undefined === undefined ? [] : module_body_or_undefined;

  // The way the pattern is written, they will always match exactly 1 thing
  // since there are no uses of star and stuff

  // Check if module path is a filename or a reference to a builtin module
  let module_path_is_builtin: boolean = false;
  let module_path_name: string = '';
  if (is_symbol(module_path_sexpr)) {
    module_path_is_builtin = false;
    module_path_name = val(module_path_sexpr);
  } else {
    module_path_is_builtin = true;
    const match_quoted_module_path_result = match(module_path_sexpr, quoted_module_path_pattern);
    if (match_quoted_module_path_result === undefined) {
      return err('module path format not supported. either use a symbol or a quoted symbol.');
    }
    const module_path_name_sexpr = match_quoted_module_path_result['module_path'][0]!;
    if (!is_symbol(module_path_name_sexpr)) {
      return err('module path format not supported. either use a symbol or a quoted symbol.');
    }
    module_path_name = val(module_path_name_sexpr);
  }

  // Check module name is symobl
  if (!is_symbol(module_name_sexpr)) {
    return err('module name should be a symbol');
  }
  const name = val(module_name_sexpr);

  return ok({
    name,
    module_path_is_builtin,
    module_path_name,
    module_body,
  });
}

export function expand_in_expression_context(
  expr: SExpr,
  compile_env: NonemptyEnvironment
): Result<FEExpr, CompileErr> {
  for (;;) {
    // We keep expanding the expr until we get a thing that's fully expanded
    // So we use an infinite loop to fake tail call optimization
    let identifier_name: string;

    // We try to find an identifier that might cause a macro expansion
    if (is_symbol(expr)) {
      // symbols might macro expand
      identifier_name = val(expr);
    } else if (is_list(expr)) {
      // lists where the head is a symbol might macro expand
      const head = car(expr);
      if (is_symbol(head)) {
        identifier_name = val(head);
      } else {
        expr = scons(ssymbol('#%app'), expr);
        continue;
      }
    } else if (is_nil(expr)) {
      expr = scons(ssymbol('#%app'), expr);
      continue;
    } else {
      // it's some datum
      expr = scons(ssymbol('#%datum'), expr);
      continue;
    }

    // We found an identifier, try all the ways we can macro expand it

    // First, it could be a builtin transformer
    const transformer = core_expression_form_transformers.get(identifier_name);
    if (transformer !== undefined) {
      return transformer(expr, compile_env);
    }

    // If not, it could be a bound syntax transformer
    const symbol_env = find_env(identifier_name, compile_env);
    if (symbol_env === undefined) {
      // unbound variable error :)
      return err('unbound variable ' + identifier_name);
    }
    if (has_syntax(symbol_env.bindings, identifier_name)) {
      // It was a bound syntax transformer
      const transformer = get_syntax(symbol_env.bindings, identifier_name);
      if (transformer === undefined) {
        return err('transformer was undefined');
      }
      const expand_once_result = apply_syntax(transformer as SExprT<EvalData>, expr, compile_env);
      if (isBadResult(expand_once_result)) {
        return expand_once_result;
      }
      expr = expand_once_result.v as SExpr;
      continue;
    }

    // If not, then it's just either an app or a variable reference
    if (is_list(expr)) {
      // It's just a normal application expression
      expr = scons(ssymbol('#%app'), expr);
      continue;
    } else {
      // It's just a plain variable
      const variable_reference_form: VariableReferenceForm = slist(
        [ssymbol('#%variable-reference'), expr] as const,
        snil()
      );
      return ok(variable_reference_form);
    }
  }
}

function expand_statement_in_internal_definition_context(
  statement: SExpr,
  compile_env: NonemptyEnvironment,
  output_statements: ModuleLevelForm[]
): Result<SExpr[], CompileErr> {
  if (is_symbol(statement)) {
    const symbol_env = find_env(val(statement), compile_env);
    if (symbol_env === undefined) {
      // unbound variable error :)
      return err('unbound variable ' + val(statement));
    }
    return then(expand_in_expression_context(statement, compile_env), (expr) => ok([expr]));
  } else if (is_list(statement)) {
    const statement_head = car(statement);
    if (is_symbol(statement_head)) {
      const transformer = core_statement_form_transformers.get(val(statement_head));
      if (transformer !== undefined) {
        return transformer(statement, compile_env, output_statements);
      } else {
        const symbol_env = find_env(val(statement_head), compile_env);
        if (symbol_env === undefined) {
          // unbound variable error :)
          return err('unbound variable ' + val(statement_head));
        }
        return then(expand_in_expression_context(statement, compile_env), (expr) => ok([expr]));
      }
    } else {
      // app
      return ok([scons(ssymbol('#%app'), statement)]);
    }
  } else if (is_nil(statement)) {
    // nil is like app
    return ok([scons(ssymbol('#%app'), statement)]);
  } else {
    // it's some datum
    return ok([scons(ssymbol('#%datum'), statement)]);
  }
}

function stack_push<T>(stack: T[], ...vals: T[]) {
  for (let i = vals.length - 1; i >= 0; i--) {
    stack.push(vals[i]);
  }
}

export function expand_in_internal_definition_context(
  statements: SExpr[],
  compile_env: NonemptyEnvironment
): Result<ModuleLevelForm[], CompileErr> {
  const statement_stack: SExpr[] = [];
  stack_push(statement_stack, ...statements);
  const output_statements: ModuleLevelForm[] = [];
  while (statement_stack.length > 0) {
    const statement = statement_stack.pop()!;
    const compile_statement_result = expand_statement_in_internal_definition_context(
      statement,
      compile_env,
      output_statements
    );
    if (isBadResult(compile_statement_result)) {
      return compile_statement_result;
    }
    stack_push(statement_stack, ...compile_statement_result.v);
  }
  return ok(output_statements);
}

export function expand_in_module_context(
  statements: SExpr[],
  compile_env: NonemptyEnvironment
): Result<ModuleLevelForm[], CompileErr> {
  return expand_in_internal_definition_context(statements, compile_env);
}

export const compile_module: CompileModule = (
  module_filename: FileName,
  module_contents: FileContents,
  host: CompilerHost
): Result<CompileModuleResultV, CompileErr> => {
  const module_sexpr_result = read(module_contents);
  if (isBadResult(module_sexpr_result)) {
    return module_sexpr_result;
  }
  const module_sexpr = module_sexpr_result.v;

  const module_info_result = get_module_info(module_sexpr);
  if (isBadResult(module_info_result)) {
    return module_info_result;
  }
  const module_info = module_info_result.v;

  const { module_path_is_builtin, module_path_name } = module_info;
  let parent_module: Module;
  let compiled_filenames: Map<FileName, FileName>;
  if (module_path_is_builtin) {
    const parent_module_result = host.read_builtin_module(module_path_name);
    if (isBadResult(parent_module_result)) {
      return parent_module_result;
    }
    parent_module = parent_module_result.v;
    compiled_filenames = new Map();
  } else {
    const parent_module_filename = host.module_name_to_filename(module_path_name, module_filename);

    // First compile it
    const parent_module_precompiled_filename = parent_module_filename + '.fep';
    const compile_result = compile(host, parent_module_filename);
    if (isBadResult(compile_result)) {
      return compile_result;
    }
    compiled_filenames = compile_result.v.compiled_filenames;

    // Now we evaluate the parent module
    const parent_module_precompiled_contents_result = host.read_file(
      parent_module_precompiled_filename
    );
    if (isBadResult(parent_module_precompiled_contents_result)) {
      return parent_module_precompiled_contents_result;
    }

    const parent_module_precompiled_contents = parent_module_precompiled_contents_result.v;
    const read_parent_module_result = read(parent_module_precompiled_contents);
    if (isBadResult(read_parent_module_result)) {
      return read_parent_module_result;
    }
    const parent_module_result = evaluate_module(read_parent_module_result.v as TopLevelForm);
    if (isBadResult(parent_module_result)) {
      return parent_module_result;
    }
    parent_module = parent_module_result.v;
  }

  const env = make_env_list(make_empty_bindings(), parent_module.provides);
  const expanded_module_statements_result = expand_in_module_context(module_info.module_body, env);
  if (isBadResult(expanded_module_statements_result)) {
    return expanded_module_statements_result;
  }
  const expanded_module_statements = expanded_module_statements_result.v;
  const fep_module: ModuleBuiltinParentForm = slist(
    [
      ssymbol('module'),
      ssymbol(module_info.name),
      slist([ssymbol('quote'), ssymbol(module_info.module_path_name)] as const, snil()),
      slist([ssymbol('#%plain-module-begin'), ...expanded_module_statements] as const, snil()),
    ] as const,
    snil()
  );
  return ok({ fep: fep_module, compiled_filenames });
};

export const compile: Compile = (
  host: CompilerHost,
  filename: FileName
): Result<CompileResultV, CompileErr> => {
  const fep_filename = filename + '.fep';

  // Check if it was already compiled
  // Exit immediately if so
  const precompiled_module_contents_r = host.read_file(fep_filename);
  if (isGoodResult(precompiled_module_contents_r)) {
    return ok({ compiled_filenames: new Map() });
  }

  const module_contents_r = host.read_file(filename);
  if (isBadResult(module_contents_r)) {
    return module_contents_r;
  }
  const module_contents = module_contents_r.v;

  const compile_r = compile_module(filename, module_contents, host);
  if (isBadResult(compile_r)) {
    return compile_r;
  }

  const fep = compile_r.v.fep;
  const fep_string = print(fep);

  const write_r = host.write_file(fep_filename, fep_string);
  if (isBadResult(write_r)) {
    return write_r;
  }

  const compiled_filenames = compile_r.v.compiled_filenames;
  compiled_filenames.set(filename, fep_filename);

  return ok({ compiled_filenames });
};
