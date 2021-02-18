import { err, ok, isBadResult } from '../utils';
import { SExpr } from '../sexpr';
import { satom, snil, slist } from '../sexpr';
import { val, car, cdr } from '../sexpr';
import { is_atom, is_value, is_list, is_nil } from '../sexpr';
import { EvalValue, EvalResult } from './types';
import { Bindings, Environment, make_env, make_env_list, find_env } from './environment';

import { primitives } from './primitives';

import { match_special_form, MatchType } from './special-form';

const primitives_bindings: Bindings = Object.entries(primitives).reduce((obj, [name, _]) => {
  obj[name] = slist([satom('primitive_function'), satom(name)], snil());
  return obj;
}, {});

export { Environment, make_env, make_env_list };

export const the_global_environment: Environment = make_env_list(primitives_bindings);

function apply(fun: EvalValue, ...args: EvalValue[]): EvalResult {
  if (!is_list(fun)) {
    return err();
  }
  const fun_type = car(fun);
  if (!is_atom(fun_type)) {
    // not in the right format for a function
    return err();
  }

  if (val(fun_type) === 'primitive_function') {
    // handle primitve function calls
    const rest = cdr(fun);
    if (!is_list(rest)) {
      return err();
    }
    const prim_name_atom = car(rest);
    if (!is_atom(prim_name_atom)) {
      return err();
    }
    const prim_name = val(prim_name_atom);
    if (!(prim_name in primitives)) {
      return err();
    }
    return primitives[prim_name](...args);
  }
  // unsupported function type
  return err();
}

export function evaluate(program: SExpr, env: Environment | undefined): EvalResult {
  // Normal form
  if (is_value(program)) {
    return ok(program);
  }

  // Variable references
  if (is_atom(program)) {
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
    return match_result.evaluator(match_result.matches, evaluate);
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

  return err();
}
