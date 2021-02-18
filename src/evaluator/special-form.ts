import { ok } from '../utils';
import { SExpr } from '../sexpr';
import { val, car, cdr } from '../sexpr';
import { is_atom, is_list } from '../sexpr';
import { equals } from '../sexpr';
import { jsonsexprToSexpr } from '../sexpr';
import { EvalResult } from './types';
import { Environment } from './environment';

type SpecialFormKeyword = 'quote';
type SpecialFormType = 'quote';

export type SpecialFormEvaluator = (
  matches: FormMatches,
  evaluate: (program: SExpr, env: Environment | undefined) => EvalResult
) => EvalResult;

interface Form {
  form_type: SpecialFormType;
  pattern: SExpr;
  variables: Set<string>; // Names of the atoms in the pattern to match against
  evaluator: SpecialFormEvaluator;
}

type FormMatches = Record<string, SExpr>;

const special_forms: Record<SpecialFormKeyword, [Form]> = {
  quote: [
    {
      form_type: 'quote',
      pattern: jsonsexprToSexpr(['quote', 'e']),
      variables: new Set(['e']),
      evaluator: ({ e }: { e: SExpr }) => ok(e),
    },
  ],
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

export enum MatchType {
  Match,
  InvalidSyntax,
  NoMatch,
}

export type MatchResult =
  | { match_type: MatchType.Match; evaluator: SpecialFormEvaluator; matches: FormMatches }
  | { match_type: MatchType.InvalidSyntax; evaluator: undefined; matches: undefined }
  | { match_type: MatchType.NoMatch; evaluator: undefined; matches: undefined };

export function match_special_form(program: SExpr): MatchResult {
  if (!is_list(program)) {
    return { match_type: MatchType.NoMatch, evaluator: undefined, matches: undefined };
  }
  const head = car(program);
  if (!is_atom(head)) {
    return { match_type: MatchType.NoMatch, evaluator: undefined, matches: undefined };
  }
  const keyword = val(head);

  if (!(keyword in special_forms)) {
    return { match_type: MatchType.NoMatch, evaluator: undefined, matches: undefined };
  }

  for (const form of special_forms[keyword]) {
    const matches: FormMatches = {};
    if (match(program, form.pattern, form.variables, matches)) {
      return { match_type: MatchType.Match, evaluator: form.evaluator, matches };
    }
  }

  return { match_type: MatchType.InvalidSyntax, evaluator: undefined, matches: undefined };
}
