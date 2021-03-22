import {
  Bindings,
  Environment,
  find_env,
  get_core,
  get_define,
  get_syntax,
  has_core,
  has_define,
  has_syntax,
  install_bindings,
  make_empty_bindings,
  make_env,
  make_env_list,
  set_core,
  set_define,
  set_syntax,
} from '../environment';
import {
  Begin0Form,
  BeginForm,
  DefineForm,
  DefineSyntaxForm,
  FEExpr,
  GeneralTopLevelFormAst,
  IfForm,
  LetForm,
  LetrecForm,
  ModuleLevelFormAst,
  PlainAppForm,
  PlainLambdaForm,
  PlainModuleBeginForm,
  ProvideForm,
  QuoteForm,
  RequireBuiltinForm,
  RequireFileForm,
  TopLevelModuleFormAst,
  VariableReferenceForm,
} from '../fep-types';
import { EvaluatorHost, FileName } from '../host';
import { get_module_info, Module } from '../modules';
import {
  car,
  cdr,
  is_boolean,
  is_boxed,
  is_list,
  is_nil,
  is_symbol,
  sbox,
  scons,
  SExprT,
  SHomList,
  snil,
  val,
} from '../sexpr';
import { err, getOk, isBadResult, ok, Result } from '../utils';
import { EvalDataType, make_fep_closure, PrimitiveTransformer } from './datatypes';
import {
  Apply,
  ApplySyntax,
  EvalErr,
  EvalResult,
  EvalSExpr,
  EvaluateGeneralTopLevel,
  EvaluateModule,
} from './types';

export const fep_apply: Apply = (fun, ...args) => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.FEPClosure) {
      // v was a FEPClosure
      const { env, formals, rest, body } = v;
      let _body: SHomList<FEExpr> = body;
      if (rest === undefined) {
        if (args.length !== formals.length) {
          return err();
        }
      } else {
        if (args.length < formals.length) {
          return err();
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
        r = evaluate_general_top_level(car(_body), inner_env);
        if (isBadResult(r)) {
          return r;
        }
        _body = cdr(_body);
      }
      return r!;
    } else if (v.variant === EvalDataType.Primitive) {
      // v is a Primitive
      return v.fun(...args);
    } else {
      // v is a PrimitiveTransformer
      // You can't call them
      return err();
    }
  }

  if (!is_list(fun)) {
    return err();
  }
  const fun_type = car(fun);
  if (!is_symbol(fun_type)) {
    // not in the right format for a function
    return err();
  }

  // unsupported function type
  return err();
};

export const fep_apply_syntax: ApplySyntax = (fun, stx, compile_env) => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.FEPClosure) {
      // v was a FEPClosure
      const { env, formals, rest, body } = v;
      let _body: SHomList<FEExpr> = body;
      if (rest !== undefined) {
        return err();
      }
      if (formals.length !== 1) {
        return err();
      }

      const bindings: Bindings = make_empty_bindings();
      set_define(bindings, formals[0], stx);

      const inner_env = make_env(bindings, env);

      let r: EvalResult;
      while (is_list(_body)) {
        r = evaluate_general_top_level(car(_body), inner_env);
        if (isBadResult(r)) {
          return r;
        }
        _body = cdr(_body);
      }
      return r!;
    } else if (v.variant === EvalDataType.Primitive) {
      // v is a Primitive
      // You should have used a PrimitiveTransformer
      return err();
    } else {
      // if (v.variant === EvalDataType.PrimitiveTransformer) {
      return (v as PrimitiveTransformer).fun(stx, compile_env);
    }
  }

  if (!is_list(fun)) {
    return err();
  }
  const fun_type = car(fun);
  if (!is_symbol(fun_type)) {
    // not in the right format for a function
    return err();
  }

  // unsupported function type
  return err();
};

export const evaluate_general_top_level: EvaluateGeneralTopLevel = (
  program: GeneralTopLevelFormAst,
  env: Environment
): EvalResult => {
  const token_val = program.x.val;
  switch (token_val) {
    // DefineForm
    case 'define': {
      const defineprogram = program as DefineForm;
      const symbol = car(cdr(defineprogram));
      const expr = car(cdr(cdr(defineprogram)));

      const r = evaluate_general_top_level(expr, env);
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

      const r = evaluate_general_top_level(expr, env);
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
      const condition_r = evaluate_general_top_level(condition, env);

      if (isBadResult(condition_r)) {
        return condition_r;
      }

      const consequent = ifprogram.y.y.x;
      const alternative = ifprogram.y.y.y.x;
      const condition_v = condition_r.v;
      return !(is_boolean(condition_v) && val(condition_v) === false)
        ? evaluate_general_top_level(consequent, env)
        : evaluate_general_top_level(alternative, env);
    }
    case 'begin': {
      let r: EvalResult;
      const beginprogram = program as BeginForm;

      let sequence: SHomList<FEExpr> = cdr(beginprogram);
      while (is_list(sequence)) {
        const expr = car(sequence);
        r = evaluate_general_top_level(expr, env);

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
      const r = evaluate_general_top_level(car(nonempty_sequence), env);

      let rest_sequence = cdr(nonempty_sequence);
      while (is_list(rest_sequence)) {
        const expr = car(rest_sequence);
        const rr = evaluate_general_top_level(expr, env);

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

        const r = evaluate_general_top_level(expr, env);
        if (isBadResult(r)) {
          return r;
        }

        set_define(bindings, val(symbol), r.v);
        list_of_binding_pairs = cdr(list_of_binding_pairs);
      }
      env = make_env(bindings, env);

      let r: EvalResult;
      let sequence: SHomList<FEExpr> = cdr(cdr(letprogram));
      while (is_list(sequence)) {
        const expr = car(sequence);
        r = evaluate_general_top_level(expr, env);

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

        const r = evaluate_general_top_level(expr, env);
        if (isBadResult(r)) {
          return r;
        }

        set_define(bindings, val(symbol), r.v);
        list_of_binding_pairs = cdr(list_of_binding_pairs);
      }

      let r: EvalResult;
      let sequence: SHomList<FEExpr> = cdr(cdr(letrecprogram));
      while (is_list(sequence)) {
        const expr = car(sequence);
        r = evaluate_general_top_level(expr, env);

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
      const fun_r = evaluate_general_top_level(car(exprs), env);

      if (isBadResult(fun_r)) {
        return fun_r;
      }
      const fun = getOk(fun_r);

      const arg_rs = homlist_to_arr(cdr(exprs)).map((fexpr) =>
        evaluate_general_top_level(fexpr, env)
      );

      const args = [];

      for (let i = 0; i < arg_rs.length; i++) {
        if (isBadResult(arg_rs[i])) {
          return arg_rs[i];
        }
        args.push(getOk(arg_rs[i]));
      }

      return fep_apply(fun, ...args);
    }
    case '#%variable-reference': {
      const variablereference_program = program as VariableReferenceForm;
      const symbol = car(cdr(variablereference_program));

      const found_env = find_env(symbol.val, env);
      if (found_env === undefined) {
        return err();
      }

      const maybe_expr = get_define(found_env.bindings, symbol.val);
      if (maybe_expr === undefined) {
        return err();
      }

      return ok(maybe_expr as EvalSExpr);
    }

    // Currently: RequireFileForm and RequireBuiltinForm
    default: {
      throw 'TODO: Not yet fully implemented';
    }
  }
};

export const evaluate_module: EvaluateModule = (
  program: TopLevelModuleFormAst,
  program_filename: FileName,
  host: EvaluatorHost
): Result<Module, EvalErr> => {
  const module_info_result = get_module_info(program);
  if (isBadResult(module_info_result)) {
    return err();
  }
  const {
    name: module_name,
    module_path_is_builtin,
    module_path_name,
    module_body: module_body_,
  } = module_info_result.v;
  let plain_module_begin = cdr(module_body_[0] as PlainModuleBeginForm);
  const module_body: ModuleLevelFormAst[] = [];
  while (is_list(plain_module_begin)) {
    module_body.push(car(plain_module_begin));
    plain_module_begin = cdr(plain_module_begin);
  }

  // Evaluate parent module
  let parent_module: Module;
  if (module_path_is_builtin) {
    const parent_module_result = host.read_builtin_module(module_path_name);
    if (isBadResult(parent_module_result)) {
      return err();
    }
    parent_module = parent_module_result.v;
  } else {
    const parent_module_r = host.read_fep_module(module_path_name, program_filename);
    if (isBadResult(parent_module_r)) {
      return err();
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
  const provides_names: Set<string> = new Set();

  for (const statement of module_body) {
    const form_type = statement.x.val;
    switch (form_type) {
      case '#%provide': {
        const provide_form = statement as ProvideForm;
        let names_to_export = provide_form.y;
        while (is_list(names_to_export)) {
          provides_names.add(names_to_export.x.val);
          names_to_export = names_to_export.y;
        }
        break;
      }
      case '#%require': {
        const require_form = statement as RequireBuiltinForm | RequireFileForm;
        const require_spec = require_form.y.x;

        // get the module
        let required_module: Module;
        if (is_list(require_spec)) {
          // builtin require
          const module_name = require_spec.y.x.val;
          const module_r = host.read_builtin_module(module_name);
          if (isBadResult(module_r)) {
            return err();
            // return err(`error requiring module ${module_name}: {module_r.err}`);
          }
          required_module = module_r.v;
        } else {
          // file require
          const module_name = require_spec.val;
          const module_r = host.read_fep_module(module_name, program_filename);
          if (isBadResult(module_r)) {
            return err();
            // return err(`error requiring module ${module_name}: {module_r.err}`);
          }
          required_module = module_r.v;
        }

        // Add its bindings to ours
        install_bindings(env.bindings, required_module.provides);
        break;
      }
      case 'begin-for-syntax': {
        throw 'Not yet implemented';
      }
      case 'module': {
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
      case 'begin-for-syntax':
      case 'module': {
        break;
      }
      default: {
        const r = evaluate_general_top_level(statement as GeneralTopLevelFormAst, env);
        if (isBadResult(r)) {
          return r;
        }
        break;
      }
    }
  }

  // Now that we've evaluated all the statements in the body, we return the module
  const exported_bindings = make_empty_bindings();
  for (const name of provides_names.keys()) {
    const name_env = find_env(name, env);
    if (name_env === undefined) {
      return err();
    }
    if (has_define(name_env.bindings, name)) {
      set_define(exported_bindings, name, get_define(name_env.bindings, name));
    } else if (has_syntax(name_env.bindings, name)) {
      set_syntax(exported_bindings, name, get_syntax(name_env.bindings, name)!);
    } else if (has_core(name_env.bindings, name)) {
      set_core(exported_bindings, name, get_core(name_env.bindings, name)!);
    }
  }

  return ok({
    name: module_name,
    filename: program_filename,
    provides: exported_bindings,
  });
};

function homlist_to_arr<T extends SExprT<U>, U>(homlist: SHomList<T>): T[] {
  const arr: T[] = [];
  while (is_list<U>(homlist)) {
    arr.push(car(homlist));
    homlist = cdr(homlist);
  }
  return arr;
}
