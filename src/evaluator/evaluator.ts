import { err, ok, isBadResult } from '../utils';
import { SExpr, sbox, SSymbol, is_boxed, is_boolean, scons } from '../sexpr';
import { val, car, cdr } from '../sexpr';
import { is_symbol, is_value, is_list, is_nil } from '../sexpr';
import { EvalDataType, make_closure, make_primitive } from './datatypes';
import { EvalValue, Evaluate, Apply, EvalResult } from './types';
import { Bindings, Environment, make_env, make_env_list, find_env } from './environment';

import { primitive_consts, primitive_funcs } from './primitives';

import { match_special_form, MatchType, SpecialFormType } from './special-form';
import { MatchObject } from '../pattern';

const primitive_funcs_bindings: Bindings = Object.entries(primitive_funcs).reduce(
  (obj, [name, fun]) => {
    obj[name] = sbox(make_primitive(fun));
    return obj;
  },
  {} as Record<string, EvalValue>
);

const primitive_consts_bindings: Bindings = Object.entries(primitive_consts).reduce(
  (obj, [name, c]) => {
    obj[name] = c;
    return obj;
  },
  {} as Record<string, EvalValue>
);

export { Environment, make_env, make_env_list };

export const the_global_environment: Environment = make_env_list(
  primitive_funcs_bindings,
  primitive_consts_bindings
);

export type SpecialFormEvaluator = (matches: MatchObject, env: Environment) => EvalResult;
const special_form_evaluators: Record<SpecialFormType, SpecialFormEvaluator> = {
  define_const: ({ id, expr }: MatchObject, env: Environment): EvalResult => {
    if (!is_symbol(id[0])) {
      return err();
    }
    const r = evaluate(expr[0], env);
    if (isBadResult(r)) {
      return r;
    }
    env!.bindings[val(id[0])] = r.v;
    return r;
  },
  define_func: ({ fun_name, params, body }: MatchObject, env: Environment): EvalResult => {
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
    env!.bindings[val(fun_name[0])] = fun;
    return ok(fun);
  },
  begin: ({ body }: MatchObject, env: Environment): EvalResult => {
    let r: EvalResult;
    for (const expr of body) {
      r = evaluate(expr, env);
      if (isBadResult(r)) {
        return r;
      }
    }
    return r!;
  },
  begin0: ({ body }: MatchObject, env: Environment): EvalResult => {
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
  cond: ({ test_exprs, then_bodies }: MatchObject, env: Environment): EvalResult => {
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
  lambda: ({ params, body }: MatchObject, env: Environment): EvalResult => {
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
  let: ({ ids, val_exprs, bodies }: MatchObject, env: Environment): EvalResult => {
    const bindings: Bindings = {};
    for (let i = 0; i < val_exprs.length; i++) {
      const id = ids[i];
      if (!is_symbol(id)) {
        return err();
      }
      const val_r = evaluate(val_exprs[i], env);
      if (isBadResult(val_r)) {
        return val_r;
      }
      bindings[val(id)] = val_r.v;
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
  'let*': ({ ids, val_exprs, bodies }: MatchObject, env: Environment): EvalResult => {
    for (let i = 0; i < val_exprs.length; i++) {
      const bindings: Bindings = {};
      const id = ids[i];
      if (!is_symbol(id)) {
        return err();
      }
      const val_r = evaluate(val_exprs[i], env);
      if (isBadResult(val_r)) {
        return val_r;
      }
      bindings[val(id)] = val_r.v;
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
  letrec: ({ ids, val_exprs, bodies }: MatchObject, env: Environment): EvalResult => {
    if (!ids.every(is_symbol)) {
      return err();
    }
    const bindings: Bindings = {};
    for (const id of ids) {
      bindings[val(id)] = undefined;
    }
    env = make_env(bindings, env);
    for (let i = 0; i < val_exprs.length; i++) {
      const id = ids[i];
      const val_r = evaluate(val_exprs[i], env);
      if (isBadResult(val_r)) {
        return val_r;
      }
      bindings[val(id)] = val_r.v;
    }
    for (let i = 0; i < bodies.length - 1; i++) {
      const r = evaluate(bodies[i], env);
      if (isBadResult(r)) {
        return r;
      }
    }
    return evaluate(bodies[bodies.length - 1], env);
  },
  quote: ({ e }: { e: SExpr[] }): EvalResult => ok(e[0]),
  quasiquote: ({ e }: { e: SExpr[] }, env: Environment): EvalResult => expand_quasiquote(e[0], env),
  unquote: (): EvalResult => err(),
};

function expand_quasiquote(e: SExpr, env: Environment): EvalResult {
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

const apply: Apply = (fun, ...args) => {
  if (is_boxed(fun)) {
    const v = fun.val;
    if (v.variant === EvalDataType.Closure) {
      // v was a Closure
      const { env, params, body } = v;
      if (args.length !== params.length) {
        return err();
      }
      const bindings: Bindings = {};
      for (let i = 0; i < params.length; i++) {
        bindings[params[i]] = args[i];
      }
      const inner_env = make_env(bindings, env);
      for (let i = 0; i < body.length - 1; i++) {
        const r = evaluate(body[i], inner_env);
        if (isBadResult(r)) {
          return r;
        }
      }
      return evaluate(body[body.length - 1], inner_env);
    } else {
      // if (v.variant === EvalDataType.Primitive) {
      // v is a Primitive
      return v.fun(...args);
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
    const v = binding_env.bindings[name];
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
    const args: EvalValue[] = [];
    while (is_list(p)) {
      const arg_r = evaluate(car(p), env);
      if (isBadResult(arg_r)) {
        return arg_r;
      }
      args.push(arg_r.v);
      p = cdr(p);
    }
    if (!is_nil(p)) {
      return err();
    }
    return apply(fun, ...args);
  }
};
