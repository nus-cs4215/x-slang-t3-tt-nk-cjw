import { Result, err, ok, isBadResult } from '../utils';
import { SListStruct, SExpr } from '../sexpr';
import { is_atom, is_number, is_value, is_list, is_nil } from '../sexpr';
import { satom, snumber, snil, slist } from '../sexpr';
import { val, car, cdr } from '../sexpr';
import { equals } from '../sexpr';
import { jsonsexprToSexpr } from '../sexpr';

type Closure = void;

export type EvalValue = SListStruct<Closure>;

type EvalResult = Result<EvalValue, void>;

type SpecialFormKeyword = 'quote';
type SpecialFormType = 'quote';

interface Form {
  form_type: SpecialFormType;
  pattern: SExpr;
  variables: Set<string>; // Names of the atoms in the pattern to match against
}

type FormMatches = Record<string, SExpr>;

const special_forms: Record<SpecialFormKeyword, [Form]> = {
  quote: [
    {
      form_type: 'quote',
      pattern: jsonsexprToSexpr(['quote', 'e']),
      variables: new Set(['e']),
    },
  ],
};

const special_forms_evaluators: Record<SpecialFormType, (matches: FormMatches) => EvalResult> = {
  quote: ({ e }: { e: SExpr }) => ok(e),
};

function match(
  program: SExpr,
  pattern: SExpr,
  variables: Set<string>,
  matches: FormMatches
): boolean {
  if (is_atom(pattern) && variables.has(val(pattern))) {
    // We matched a variable in the form
    matches[val(pattern)] = program;
    return true;
  }

  // We need to structurally match program against the pattern
  if (!is_list(pattern)) {
    return equals(program, pattern);
  }

  // pattern is a list, recurse on both sides
  if (!is_list(program)) {
    return false;
  }

  return (
    match(car(program), car(pattern), variables, matches) &&
    match(cdr(program), cdr(pattern), variables, matches)
  );
}

enum MatchErr {
  InvalidSyntax,
  NoMatch,
}

function match_special_form(program: SExpr): [SpecialFormType, FormMatches] | MatchErr {
  if (!is_list(program)) {
    return MatchErr.NoMatch;
  }
  const head = car(program);
  if (!is_atom(head)) {
    return MatchErr.NoMatch;
  }
  const keyword = val(head);

  if (!(keyword in special_forms)) {
    return MatchErr.NoMatch;
  }

  for (const form of special_forms[keyword]) {
    const matches: FormMatches = {};
    if (match(program, form.pattern, form.variables, matches)) {
      return [form.form_type as SpecialFormType, matches];
    }
  }

  return MatchErr.InvalidSyntax;
}

export interface Environment {
  bindings: Record<string, EvalValue>;
  parent: Environment | undefined;
}

export function make_env(
  bindings: Record<string, EvalValue>,
  parent: Environment | undefined
): Environment {
  return { bindings, parent };
}

export function make_env_list(...bindings: Record<string, EvalValue>[]): Environment | undefined {
  return bindings.reduceRight((env, bindings) => make_env(bindings, env), undefined);
}

function find_env(name: string, env_: Environment | undefined): Environment | undefined {
  let env: Environment | undefined;
  for (env = env_; env !== undefined; env = env.parent) {
    if (name in env.bindings) {
      break;
    }
  }
  return env;
}

const primitives: Record<string, (...args: EvalValue[]) => EvalResult> = {
  '+': (...args) => {
    let x = 0;
    for (const arg of args) {
      if (is_number(arg)) {
        x += val(arg);
      } else {
        return err();
      }
    }
    return ok(snumber(x));
  },
};

export const the_global_environment: Environment = make_env(
  {
    '+': slist([satom('primitive_function'), satom('+')], snil()),
  },
  undefined
);

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

  if (match_result === MatchErr.NoMatch) {
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
  } else if (match_result === MatchErr.InvalidSyntax) {
    // Matched the keyword but the rest died
    return err();
  } else {
    // It matched a special form
    const [form_type, matches] = match_result;
    return special_forms_evaluators[form_type](matches);
  }

  return err();
}
