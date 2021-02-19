import { err, ok, isBadResult } from '../utils';
import { ssymbol, snil, slist, SExpr } from '../sexpr';
import { val, car, cdr } from '../sexpr';
import { is_symbol, is_value, is_list, is_nil } from '../sexpr';
import { EvalValue, Evaluate, Apply, EvalResult } from './types';
import { Bindings, Environment, make_env, make_env_list, find_env } from './environment';

import { primitives } from './primitives';

import { match_special_form, MatchType, SpecialForms } from './special-form';
import { MatchObject } from '../pattern';

const primitives_bindings: Bindings = Object.entries(primitives).reduce((obj, [name, _]) => {
  obj[name] = slist([ssymbol('primitive_function'), ssymbol(name)], snil());
  return obj;
}, {});

export { Environment, make_env, make_env_list };

export const the_global_environment: Environment = make_env_list(primitives_bindings);

export type SpecialFormEvaluator = (
  matches: MatchObject,
  env: Environment | undefined
) => EvalResult;
const special_form_evaluators: Record<SpecialForms, SpecialFormEvaluator> = {
  let: ({ ids, val_exprs, bodies }: MatchObject, env: Environment | undefined): EvalResult => {
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
  quote: ({ e }: { e: SExpr[] }): EvalResult => ok(e[0]),
};

const apply: Apply = (fun, ...args) => {
  if (!is_list(fun)) {
    return err();
  }
  const fun_type = car(fun);
  if (!is_symbol(fun_type)) {
    // not in the right format for a function
    return err();
  }

  if (val(fun_type) === 'primitive_function') {
    // handle primitve function calls
    const rest = cdr(fun);
    if (!is_list(rest)) {
      return err();
    }
    const prim_name_symbol = car(rest);
    if (!is_symbol(prim_name_symbol)) {
      return err();
    }
    const prim_name = val(prim_name_symbol);
    if (!(prim_name in primitives)) {
      return err();
    }
    return primitives[prim_name](...args);
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
    return ok(binding_env.bindings[name]);
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
