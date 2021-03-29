import {
  Bindings,
  BindingType,
  define_binding,
  Environment,
  find_env,
  get_binding,
  install_bindings,
  make_empty_bindings,
  make_env,
  make_env_list,
  set_binding,
  set_define,
  set_syntax,
} from '../environment';
import {
  Begin0Form,
  BeginForm,
  DefineForm,
  DefineSyntaxForm,
  ExprForm,
  ExprOrDefineAst,
  IfForm,
  LetForm,
  LetrecForm,
  StatementAst,
  PlainAppForm,
  PlainLambdaForm,
  PlainModuleBeginForm,
  ProvideForm,
  QuoteForm,
  RequireForm,
  ModuleAst,
  VariableReferenceForm,
  SetForm,
  ExprOrDefineForm,
} from '../fep-types';
import { EvaluatorHost, FileName } from '../host';
import { js_transpile_run_expr_or_define, js_transpile_run_module } from '../js-eval/js-eval';
import { get_module_info, Module } from '../modules';
import { extract_matches, match, read_pattern } from '../pattern';
import { print } from '../printer';
import { read } from '../reader';
import {
  car,
  cdr,
  homlist_to_arr,
  is_boolean,
  is_boxed,
  is_list,
  is_nil,
  sbox,
  scons,
  SExpr,
  SExprT,
  SHomList,
  snil,
  SSymbol,
  val,
} from '../sexpr';
import { err, getOk, isBadResult, ok, Result } from '../utils';
import { EvalDataType, make_fep_closure, Primitive, PrimitiveTransformer } from './datatypes';
import {
  Apply,
  ApplySyntax,
  EvalErr,
  EvalResult,
  EvalSExpr,
  EvaluateExprOrDefine,
  EvaluateModule,
} from './types';

export const apply: Apply = (fun: EvalSExpr, ...args: EvalSExpr[]): EvalResult => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.FEPClosure) {
      // v was a FEPClosure
      const { env, formals, rest, body } = v;
      let _body: SHomList<ExprOrDefineForm> = body;
      if (rest === undefined) {
        if (args.length < formals.length) {
          return err(
            `apply: too few arguments given. expected arguments ${formals.join(', ')} but got ${
              args.length
            } arguments`
          );
        } else if (args.length > formals.length) {
          return err(
            `apply: too many arguments given. expected arguments ${formals.join(', ')} but got ${
              args.length
            } arguments`
          );
        }
      } else {
        if (args.length < formals.length) {
          return err(
            `apply: too few arguments given. expected arguments ${formals.join(', ')} but got ${
              args.length
            } arguments`
          );
        }
      }

      const bindings: Bindings = make_empty_bindings();
      for (let i = 0; i < formals.length; i++) {
        set_define(bindings, formals[i], args[i]);
      }

      let rest_args: SExprT<unknown> = snil();
      for (let i = args.length - 1; i > formals.length - 1; i--) {
        rest_args = scons(args[i], rest_args);
      }

      if (rest !== undefined) {
        set_define(bindings, rest, rest_args);
      }
      const inner_env = make_env(bindings, env);

      let r: EvalResult;
      while (is_list(_body)) {
        r = evaluate_expr_or_define(car(_body), inner_env);
        if (isBadResult(r)) {
          return r;
        }
        _body = cdr(_body);
      }
      return r!;
    } else if (v.variant === EvalDataType.Primitive) {
      // v is a Primitive
      return v.fun(...args);
    }
  }

  return err('apply: tried to call non-function value');
};

export const apply_syntax: ApplySyntax = (
  fun: EvalSExpr,
  stx: EvalSExpr,
  compile_env: Environment
): EvalResult => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.FEPClosure) {
      // v was a FEPClosure
      const { env, formals, rest, body } = v;
      let _body: SHomList<ExprOrDefineForm> = body;
      if (rest !== undefined || formals.length !== 1) {
        return err('apply_syntax: syntax transformers should take exactly one argument');
      }

      const bindings: Bindings = make_empty_bindings();
      set_define(bindings, formals[0], stx);

      const inner_env = make_env(bindings, env);

      let r: EvalResult;
      while (is_list(_body)) {
        r = evaluate_expr_or_define(car(_body), inner_env);
        if (isBadResult(r)) {
          return r;
        }
        _body = cdr(_body);
      }
      return r!;
    } else if (v.variant === EvalDataType.Primitive) {
      return (v as Primitive).fun(stx);
    } else if (v.variant === EvalDataType.PrimitiveTransformer) {
      return (v as PrimitiveTransformer).fun(stx, compile_env);
    }
  }

  return err('apply_syntax: tried to call non-function value');
};

const interpret_expr_or_define: EvaluateExprOrDefine = (
  program: ExprOrDefineAst,
  env: Environment
): EvalResult => {
  const token_val = program.x.val;
  switch (token_val) {
    // DefineForm
    case 'define': {
      const defineprogram = program as DefineForm;
      const symbol = car(cdr(defineprogram));
      const expr = car(cdr(cdr(defineprogram)));

      const r = interpret_expr_or_define(expr, env);
      if (isBadResult(r)) {
        return r;
      }

      set_define(env!.bindings, val(symbol), r.v);
      return r;
    }

    // Define Syntax Form
    case 'define-syntax': {
      const definesyntax_program = program as DefineSyntaxForm;
      const symbol = car(cdr(definesyntax_program));
      const expr = car(cdr(cdr(definesyntax_program)));

      const r = interpret_expr_or_define(expr, env);
      if (isBadResult(r)) {
        return r;
      }

      set_syntax(env!.bindings, val(symbol), r.v);
      return r;
    }

    // FEExpr
    case '#%plain-lambda': {
      const plainlambda_program = program as PlainLambdaForm;
      let unparsed_formals = car(cdr(plainlambda_program));
      const body = cdr(cdr(plainlambda_program));

      const formals: string[] = [];
      while (is_list(unparsed_formals)) {
        const formal = val(car(unparsed_formals));
        formals.push(formal);
        unparsed_formals = cdr(unparsed_formals);
      }

      let rest: string | undefined;
      if (is_nil(unparsed_formals)) {
        rest = undefined;
      } else {
        rest = val(unparsed_formals);
      }

      return ok(sbox(make_fep_closure(env, formals, rest, body)));
    }
    case 'if': {
      const ifprogram = program as IfForm;
      const condition = ifprogram.y.x;
      const condition_r = interpret_expr_or_define(condition, env);

      if (isBadResult(condition_r)) {
        return condition_r;
      }

      const consequent = ifprogram.y.y.x;
      const alternative = ifprogram.y.y.y.x;
      const condition_v = condition_r.v;
      return !(is_boolean(condition_v) && val(condition_v) === false)
        ? interpret_expr_or_define(consequent, env)
        : interpret_expr_or_define(alternative, env);
    }
    case 'begin': {
      let r: EvalResult;
      const beginprogram = program as BeginForm;

      let sequence: SHomList<ExprForm> = cdr(beginprogram);
      while (is_list(sequence)) {
        const expr = car(sequence);
        r = interpret_expr_or_define(expr, env);

        if (isBadResult(r)) {
          return r;
        }
        sequence = cdr(sequence);
      }

      return r!;
    }
    case 'begin0': {
      const begin0program = program as Begin0Form;
      const nonempty_sequence = cdr(begin0program);
      const r = interpret_expr_or_define(car(nonempty_sequence), env);

      let rest_sequence = cdr(nonempty_sequence);
      while (is_list(rest_sequence)) {
        const expr = car(rest_sequence);
        const rr = interpret_expr_or_define(expr, env);

        if (isBadResult(rr)) {
          return rr;
        }
        rest_sequence = cdr(rest_sequence);
      }

      return r;
    }
    case 'let': {
      const letprogram = program as LetForm;
      const bindings: Bindings = make_empty_bindings();
      let list_of_binding_pairs = car(cdr(letprogram));
      while (is_list(list_of_binding_pairs)) {
        const binding_pair = car(list_of_binding_pairs);
        const symbol = car(binding_pair);
        const expr = car(cdr(binding_pair));

        const r = interpret_expr_or_define(expr, env);
        if (isBadResult(r)) {
          return r;
        }

        set_define(bindings, val(symbol), r.v);
        list_of_binding_pairs = cdr(list_of_binding_pairs);
      }
      env = make_env(bindings, env);

      let r: EvalResult;
      let sequence: SHomList<ExprForm> = cdr(cdr(letprogram));
      while (is_list(sequence)) {
        const expr = car(sequence);
        r = interpret_expr_or_define(expr, env);

        if (isBadResult(r)) {
          return r;
        }
        sequence = cdr(sequence);
      }

      return r!;
    }
    case 'letrec': {
      const letrecprogram = program as LetrecForm;
      const bindings: Bindings = make_empty_bindings();
      let list_of_binding_pairs = car(cdr(letrecprogram));

      // the copy is used to iterate through the symbols once
      let list_of_binding_pairs_copy = list_of_binding_pairs;
      while (is_list(list_of_binding_pairs_copy)) {
        const symbol = car(car(list_of_binding_pairs_copy));
        set_define(bindings, val(symbol), undefined);
        list_of_binding_pairs_copy = cdr(list_of_binding_pairs_copy);
      }
      env = make_env(bindings, env);

      while (is_list(list_of_binding_pairs)) {
        const binding_pair = car(list_of_binding_pairs);
        const symbol = car(binding_pair);
        const expr = car(cdr(binding_pair));

        const r = interpret_expr_or_define(expr, env);
        if (isBadResult(r)) {
          return r;
        }

        set_define(bindings, val(symbol), r.v);
        list_of_binding_pairs = cdr(list_of_binding_pairs);
      }

      let r: EvalResult;
      let sequence: SHomList<ExprForm> = cdr(cdr(letrecprogram));
      while (is_list(sequence)) {
        const expr = car(sequence);
        r = interpret_expr_or_define(expr, env);

        if (isBadResult(r)) {
          return r;
        }
        sequence = cdr(sequence);
      }

      return r!;
    }
    case 'quote': {
      const quoteprogram = program as QuoteForm;
      return ok(quoteprogram.y.x);
    }
    case '#%plain-app': {
      const plainapp_program = program as PlainAppForm;
      const exprs = cdr(plainapp_program);
      const fun_r = interpret_expr_or_define(car(exprs), env);

      if (isBadResult(fun_r)) {
        return fun_r;
      }
      const fun = getOk(fun_r);

      const arg_rs = homlist_to_arr(cdr(exprs)).map((fexpr) =>
        interpret_expr_or_define(fexpr, env)
      );

      const args = [];

      for (let i = 0; i < arg_rs.length; i++) {
        if (isBadResult(arg_rs[i])) {
          return arg_rs[i];
        }
        args.push(getOk(arg_rs[i]));
      }

      return apply(fun, ...args);
    }
    case '#%variable-reference': {
      const variablereference_program = program as VariableReferenceForm;
      const symbol = car(cdr(variablereference_program));

      const found_env = find_env(symbol.val, env);
      if (found_env === undefined) {
        return err(`evaluate (#%variable-reference): could not find variable ${symbol.val}`);
      }

      const binding = get_binding(found_env.bindings, symbol.val)!;
      if (binding._type !== BindingType.Define || binding.val === undefined) {
        return err(
          `evaluate (#%variable-reference): tried to use variable ${symbol.val} before initialization`
        );
      }
      return ok(binding.val as EvalSExpr);
    }

    case 'set!': {
      const set_program = program as SetForm;
      const symbol = car(cdr(set_program));

      const found_env = find_env(symbol.val, env);
      const expr = car(cdr(cdr(set_program)));
      const r = interpret_expr_or_define(expr, env);
      if (isBadResult(r)) {
        return r;
      }

      if (found_env === undefined) {
        return err(
          `evaluate (set!): assignment disallowed; cannot set variable ${symbol.val} before its definition`
        );
      }

      const binding = get_binding(found_env.bindings, symbol.val)!;
      if (binding._type !== BindingType.Define || binding.val === undefined) {
        return err(`evaluate (set!): tried to set variable ${symbol.val} before initialization`);
      }

      const new_binding = define_binding(getOk(r));

      set_binding(found_env.bindings, symbol.val, new_binding);
      // deviates from Racket: returning the value that has been set
      return r;
    }

    default: {
      throw 'unreachable code';
    }
  }
};

export const interpret_module: EvaluateModule = (
  program_str: string,
  program_filename: FileName,
  host: EvaluatorHost
): Result<Module, EvalErr> => {
  const program = getOk(read(program_str)) as ModuleAst;
  const module_info_result = get_module_info(program);
  if (isBadResult(module_info_result)) {
    return module_info_result;
  }
  const {
    name: module_name,
    module_path_is_builtin,
    module_path_name,
    module_body: module_body_,
  } = module_info_result.v;
  let plain_module_begin = cdr(module_body_[0] as PlainModuleBeginForm);
  const module_body: StatementAst[] = [];
  while (is_list(plain_module_begin)) {
    module_body.push(car(plain_module_begin));
    plain_module_begin = cdr(plain_module_begin);
  }

  // Evaluate parent module
  let parent_module: Module;
  if (module_path_is_builtin) {
    const parent_module_result = host.read_builtin_module(module_path_name);
    if (isBadResult(parent_module_result)) {
      return parent_module_result;
    }
    parent_module = parent_module_result.v;
  } else {
    const parent_module_r = host.read_fep_module(module_path_name, program_filename);
    if (isBadResult(parent_module_r)) {
      return parent_module_r;
    }
    parent_module = parent_module_r.v;
  }

  // Create env containing the provides
  const env = make_env_list(make_empty_bindings(), parent_module.provides);

  // We do a first pass through the entire module body first to:
  //  - find all provides so we know what we need to export
  //  - find all requires and import all of them
  //  - TODO: handle for syntaimport { getOk } from '../utils/result';
  //  - TODO: evaluate submodules
  // TODO: Make this less hacky lmao
  const provide_names: Map<string, string> = new Map();

  for (const statement of module_body) {
    const form_type = statement.x.val;
    switch (form_type) {
      case '#%provide': {
        const provide_form = statement as ProvideForm;
        const export_specs_match_result = match(
          provide_form,
          getOk(read_pattern('(head export_specs ...)'))
        );
        if (export_specs_match_result === undefined) {
          return err(`interpret_module: incorrect form for #%provide ${print(statement)}`);
        }
        const export_specs = extract_matches(
          export_specs_match_result,
          (export_specs: SExpr[]) => export_specs
        );
        for (const spec of export_specs) {
          {
            const rename_match_result = match(
              spec,
              getOk(read_pattern("('rename local exported)"))
            );
            if (rename_match_result !== undefined) {
              extract_matches(rename_match_result, (local: [SSymbol], exported: [SSymbol]) =>
                provide_names.set(val(local[0]), val(exported[0]))
              );
              continue;
            }
          }
          {
            const rename_match_result = match(spec, getOk(read_pattern('sym-name')));
            if (rename_match_result !== undefined) {
              extract_matches(rename_match_result, (name: [SSymbol]) =>
                provide_names.set(val(name[0]), val(name[0]))
              );
              continue;
            }
          }
          return err(`interpret_module: incorrect export spec form for #%provide ${print(spec)}`);
        }
        break;
      }
      case '#%require': {
        const require_form = statement as RequireForm;
        const import_specs_match_result = match(
          require_form,
          getOk(read_pattern('(head import_specs ...)'))
        );
        if (import_specs_match_result === undefined) {
          return err(`interpret_module: incorrect form for #%require ${print(statement)}`);
        }
        const import_specs = extract_matches(
          import_specs_match_result,
          (import_specs: SExpr[]) => import_specs
        );
        for (const spec of import_specs) {
          {
            const match_result = match(spec, getOk(read_pattern('sym-name')));
            if (match_result !== undefined) {
              const module_name = extract_matches(match_result, (name: [SSymbol]) => val(name[0]));
              // compile required module
              const module_r = host.read_fep_module(module_name, program_filename);
              if (isBadResult(module_r)) {
                return err(
                  `interpret_module (#%require): error while requiring module ${module_name}`
                );
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
                  `interpret_module (#%require): error while requiring builtin module ${module_name}`
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
                return err(
                  `interpret_module (#%require): error while requiring module ${module_name}`
                );
              }
              const binding = get_binding(module_r.v.provides, local);
              if (binding === undefined) {
                return err(
                  `interpret_module (#%require): binding ${local} not exported in module ${module_name}`
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
                return err(
                  `interpret_module (#%require): error while requiring module ${module_name}`
                );
              }
              const binding = get_binding(module_r.v.provides, local);
              if (binding === undefined) {
                return err(
                  `interpret_module (#%require): binding ${local} not exported in module ${module_name}`
                );
              }
              set_binding(env.bindings, exported, binding);
              continue;
            }
          }
          return err(`interpret_module: incorrect import spec form for #%require ${print(spec)}`);
        }
        break;
      }
      case 'begin-for-syntax': {
        throw 'Not yet implemented';
      }
      default: {
        break;
      }
    }
  }

  // Now we evaluate the module body for realz
  for (const statement of module_body) {
    const form_type = statement.x.val;
    switch (form_type) {
      case '#%provide':
      case '#%require':
      case 'begin-for-syntax': {
        break;
      }
      default: {
        const r = interpret_expr_or_define(statement as ExprOrDefineAst, env);
        if (isBadResult(r)) {
          return r;
        }
        break;
      }
    }
  }

  // Now that we've evaluated all the statements in the body, we return the module
  const exported_bindings = make_empty_bindings();
  for (const [name, exported] of provide_names.entries()) {
    const name_env = find_env(name, env);
    if (name_env === undefined) {
      return err(`interpret_module (export): could not find binding for ${name} to export`);
    }
    const binding = get_binding(name_env.bindings, name);
    if (binding === undefined) {
      return err(`interpret_module (export): binding for ${name} was not initialized`);
    }
    set_binding(exported_bindings, exported, binding);
  }

  return ok({
    name: module_name,
    filename: program_filename,
    provides: exported_bindings,
  });
};

export const evaluate_expr_or_define: EvaluateExprOrDefine = interpret_expr_or_define;
export const evaluate_module: EvaluateModule = interpret_module;

// export const evaluate_expr_or_define: EvaluateExprOrDefine = (
//   program: ExprOrDefineAst,
//   env: Environment
// ): EvalResult => {
//   // Heuristic: if evaluating a function,
//   // use transpiler so that we get speed when we run the function
//   if (is_list(program) && is_symbol(car(program)) && val(car(program)) === '#%plain-lambda') {
//     return js_transpile_run_expr_or_define(program, env);
//   }
//   return interpret_expr_or_define(program, env);
// };

// export const evaluate_module: EvaluateModule = (
//   program_str: string,
//   program_filename: FileName,
//   host: EvaluatorHost
// ): Result<Module, EvalErr> => {
//   // Heuristic: if there are no #%plain-lambda, then just interpret it.
//   if (!program_str.includes('#%plain-lambda')) {
//     return interpret_module(program_str, program_filename, host);
//   }
//   return js_transpile_run_module(program_str, program_filename, host);
// };
