import { SHomList } from './../sexpr/sexpr';
import { QuoteForm, BeginForm, FEExpr } from './../fep-types';
import {
  Bindings,
  Environment,
  find_env,
  get_define,
  make_empty_bindings,
  make_env,
  set_define,
} from '../environment';
import { IfForm } from '../fep-types';
import { MatchObject } from '../pattern';
import {
  car,
  cdr,
  is_boolean,
  is_boxed,
  is_list,
  is_nil,
  is_symbol,
  is_value,
  sboolean,
  sbox,
  scons,
  SSymbol,
  val,
} from '../sexpr';
import { err, isBadResult, ok } from '../utils';
import { EvalData, EvalDataType, make_closure } from './datatypes';
import { MatchType, match_special_form, SpecialFormType } from './special-form';
import {
  Apply,
  ApplySyntax,
  EvalResult,
  EvalSExpr,
  Evaluate,
  EvaluateGeneralTopLevel,
  EvaluateTopLevel,
} from './types';

export type SpecialFormEvaluator = (matches: MatchObject<EvalData>, env: Environment) => EvalResult;
const special_form_evaluators: Record<SpecialFormType, SpecialFormEvaluator> = {
  define_const: ({ id, expr }: MatchObject<EvalData>, env: Environment): EvalResult => {
    if (!is_symbol(id[0])) {
      return err();
    }
    const r = evaluate(expr[0], env);
    if (isBadResult(r)) {
      return r;
    }
    set_define(env!.bindings, val(id[0]), r.v);
    return r;
  },
  define_func: (
    { fun_name, params, body }: MatchObject<EvalData>,
    env: Environment
  ): EvalResult => {
    if (!is_symbol(fun_name[0])) {
      return err();
    }
    if (params === undefined) {
      params = [];
    }
    if (!params.every(is_symbol)) {
      return err();
    }
    const fun = sbox(
      make_closure(
        env,
        params.map((p: SSymbol) => val(p)),
        body
      )
    );
    set_define(env!.bindings, val(fun_name[0]), fun);
    return ok(fun);
  },
  begin: ({ body }: MatchObject<EvalData>, env: Environment): EvalResult => {
    let r: EvalResult;
    for (const expr of body) {
      r = evaluate(expr, env);
      if (isBadResult(r)) {
        return r;
      }
    }
    return r!;
  },
  begin0: ({ body }: MatchObject<EvalData>, env: Environment): EvalResult => {
    const it = body[Symbol.iterator]();
    const r = evaluate(it.next().value, env);
    for (const expr of it) {
      const rr = evaluate(expr, env);
      if (isBadResult(rr)) {
        return rr;
      }
    }
    return r;
  },
  cond: ({ test_exprs, then_bodies }: MatchObject<EvalData>, env: Environment): EvalResult => {
    for (let i = 0; i < test_exprs.length; i++) {
      const r: EvalResult = evaluate(test_exprs[i], env);
      if (isBadResult(r)) {
        return r;
      }
      const v = r.v;
      if (is_boolean(v) && val(v) === false) {
        continue;
      }
      // Fulfilled the condition
      let t = then_bodies[i];
      if (is_nil(t)) {
        // No body
        return r;
      }

      let r2;
      while (is_list(t) && !is_nil(cdr(t))) {
        r2 = evaluate(car(t), env);
        if (isBadResult(r2)) {
          return r2;
        }
        t = cdr(t);
      }
      if (!is_list(t)) {
        return err();
      }
      return evaluate(car(t), env);
    }
    return err();
  },
  and: ({ exprs }: MatchObject<EvalData>, env: Environment): EvalResult => {
    if (exprs === undefined) {
      return ok(sboolean(true));
    }
    for (let i = 0; i < exprs.length - 1; i++) {
      const r: EvalResult = evaluate(exprs[i], env);
      if (isBadResult(r)) {
        return r;
      }
      const v = r.v;

      // SHORTCIRCUIT IF FALSE
      if (is_boolean(v) && val(v) === false) {
        return r;
      }
    }
    return evaluate(exprs[exprs.length - 1], env);
  },
  or: ({ exprs }: MatchObject<EvalData>, env: Environment): EvalResult => {
    if (exprs === undefined) {
      return ok(sboolean(false));
    }
    for (let i = 0; i < exprs.length; i++) {
      const r: EvalResult = evaluate(exprs[i], env);
      if (isBadResult(r)) {
        return r;
      }
      const v = r.v;

      // SHORTCIRCUIT IF NOT FALSE
      if (!(is_boolean(v) && val(v) === false)) {
        return r;
      }
    }
    return evaluate(exprs[exprs.length - 1], env);
  },
  lambda: ({ params, body }: MatchObject<EvalData>, env: Environment): EvalResult => {
    if (params === undefined) {
      params = [];
    }
    if (!params.every(is_symbol)) {
      return err();
    }
    return ok(
      sbox(
        make_closure(
          env,
          params.map((p: SSymbol) => val(p)),
          body
        )
      )
    );
  },
  let: ({ ids, val_exprs, bodies }: MatchObject<EvalData>, env: Environment): EvalResult => {
    const bindings: Bindings = make_empty_bindings();
    for (let i = 0; i < val_exprs.length; i++) {
      const id = ids[i];
      if (!is_symbol(id)) {
        return err();
      }
      const val_r = evaluate(val_exprs[i], env);
      if (isBadResult(val_r)) {
        return val_r;
      }
      set_define(bindings, val(id), val_r.v);
    }
    env = make_env(bindings, env);
    for (let i = 0; i < bodies.length - 1; i++) {
      const r = evaluate(bodies[i], env);
      if (isBadResult(r)) {
        return r;
      }
    }
    return evaluate(bodies[bodies.length - 1], env);
  },
  'let*': ({ ids, val_exprs, bodies }: MatchObject<EvalData>, env: Environment): EvalResult => {
    for (let i = 0; i < val_exprs.length; i++) {
      const bindings: Bindings = make_empty_bindings();
      const id = ids[i];
      if (!is_symbol(id)) {
        return err();
      }
      const val_r = evaluate(val_exprs[i], env);
      if (isBadResult(val_r)) {
        return val_r;
      }
      set_define(bindings, val(id), val_r.v);
      env = make_env(bindings, env);
    }
    for (let i = 0; i < bodies.length - 1; i++) {
      const r = evaluate(bodies[i], env);
      if (isBadResult(r)) {
        return r;
      }
    }
    return evaluate(bodies[bodies.length - 1], env);
  },
  letrec: ({ ids, val_exprs, bodies }: MatchObject<EvalData>, env: Environment): EvalResult => {
    if (!ids.every(is_symbol)) {
      return err();
    }
    const bindings: Bindings = make_empty_bindings();
    for (const id of ids) {
      set_define(bindings, val(id), undefined);
    }
    env = make_env(bindings, env);
    for (let i = 0; i < val_exprs.length; i++) {
      const id = ids[i];
      const val_r = evaluate(val_exprs[i], env);
      if (isBadResult(val_r)) {
        return val_r;
      }
      set_define(bindings, val(id), val_r.v);
    }
    for (let i = 0; i < bodies.length - 1; i++) {
      const r = evaluate(bodies[i], env);
      if (isBadResult(r)) {
        return r;
      }
    }
    return evaluate(bodies[bodies.length - 1], env);
  },
  quote: ({ e }: MatchObject<EvalData>): EvalResult => ok(e[0]),
  quasiquote: ({ e }: MatchObject<EvalData>, env: Environment): EvalResult =>
    expand_quasiquote(e[0], env),
  unquote: (): EvalResult => err(),
};

function expand_quasiquote(e: EvalSExpr, env: Environment): EvalResult {
  if (is_list(e)) {
    const a = car(e);
    const d = cdr(e);
    if (is_symbol(a) && val(a) === 'unquote') {
      if (!is_list(d)) {
        return err();
      }
      if (!is_nil(cdr(d))) {
        return err();
      }
      return evaluate(car(d), env);
    }
    const ar = expand_quasiquote(a, env);
    if (isBadResult(ar)) {
      return ar;
    }
    const dr = expand_quasiquote(d, env);
    if (isBadResult(dr)) {
      return dr;
    }
    return ok(scons(ar.v, dr.v));
  } else {
    return ok(e);
  }
}

export const apply_syntax: ApplySyntax = (fun, stx, compile_env) => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.Closure) {
      // v was a Closure
      // closure syntaxes don't support env... (for now?)
      const { env, params, body } = v;
      if (1 !== params.length) {
        return err();
      }
      const bindings: Bindings = make_empty_bindings();
      set_define(bindings, params[0], stx);
      const inner_env = make_env(bindings, env);
      for (let i = 0; i < body.length - 1; i++) {
        const r = evaluate(body[i], inner_env);
        if (isBadResult(r)) {
          return r;
        }
      }
      return evaluate(body[body.length - 1], inner_env);
    } else if (v.variant === EvalDataType.Primitive) {
      // v is a Primitive
      // You should have used a PrimitiveTransformer
      return err();
    } else {
      // if (v.variant === EvalDataType.PrimitiveTransformer) {
      return v.fun(stx, compile_env);
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

export const apply: Apply = (fun, ...args) => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.Closure) {
      // v was a Closure
      const { env, params, body } = v;
      if (args.length !== params.length) {
        return err();
      }
      const bindings: Bindings = make_empty_bindings();
      for (let i = 0; i < params.length; i++) {
        set_define(bindings, params[i], args[i]);
      }
      const inner_env = make_env(bindings, env);
      for (let i = 0; i < body.length - 1; i++) {
        const r = evaluate(body[i], inner_env);
        if (isBadResult(r)) {
          return r;
        }
      }
      return evaluate(body[body.length - 1], inner_env);
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

export const evaluate: Evaluate = (program, env) => {
  // Other values cannot be evaluated
  if (is_boxed(program)) {
    return err();
  }

  // Normal form
  if (is_value(program)) {
    return ok(program);
  }

  // Variable references
  if (is_symbol(program)) {
    const name = val(program);
    const binding_env = find_env(name, env);
    if (binding_env === undefined) {
      // Unbound variable error
      return err();
    }
    const v = get_define(binding_env.bindings, name) as EvalSExpr | undefined;
    return v !== undefined ? ok(v) : err();
  }

  if (is_nil(program)) {
    return err();
  }

  // Special forms
  const match_result = match_special_form(program);

  if (match_result.match_type === MatchType.Match) {
    // It matched a special form
    return special_form_evaluators[match_result.form](match_result.matches, env);
  } else if (match_result.match_type === MatchType.InvalidSyntax) {
    // Matched the keyword but the rest died
    return err();
  } else {
    // if (match_result.match_type === MatchType.NoMatch)
    // It's a function call or variable
    const fun_r = evaluate(car(program), env);
    if (isBadResult(fun_r)) {
      return fun_r;
    }
    const fun = fun_r.v;

    let p = cdr(program);
    const args: EvalSExpr[] = [];
    while (is_list(p)) {
      const arg_r = evaluate(car(p), env);
      if (isBadResult(arg_r)) {
        return arg_r;
      }
      args.push(arg_r.v);
      p = cdr(p);
    }
    if (!is_nil<EvalData>(p)) {
      return err();
    }
    return apply(fun, ...args);
  }
};

export const evaluate_top_level: EvaluateTopLevel = (program_, env_) => {
  throw 'Not yet implemented';
};

export const evaluate_general_top_level: EvaluateGeneralTopLevel = (program, env) => {
  const token_val = program.x.val;
  switch (token_val) {
    // DefineForm
    case 'define': {
      throw 'TODO: Implement define';
    }

    // Define Syntax Form
    case 'define-syntax': {
      throw 'TODO: Implement define-syntax';
    }

    // FEExpr
    case '#%plain-lambda': {
      throw 'TODO: Implement #%plain-lambda';
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
      throw 'TODO: Implement begin0';
    }
    case 'let': {
      throw 'TODO: Implement let';
    }
    case 'letrec': {
      throw 'TODO: Implement letrec';
    }
    case 'quote': {
      const quoteprogram = program as QuoteForm;
      return ok(quoteprogram.y.x);
    }
    case '#%plain-app': {
      throw 'TODO: Implement #%plain-app';
    }
    case '#%variable-reference': {
      throw 'TODO: Implement #%variable-reference';
    }

    // Currently: RequireFileForm and RequireBuiltinForm
    default: {
      throw 'TODO: Not yet fully implemented';
    }
  }
};
