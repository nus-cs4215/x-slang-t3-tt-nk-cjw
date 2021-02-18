import { SExpr, SList, SListStruct, JsonSExpr } from '../sexpr';
import { is_boxed } from '../sexpr';
import { val, car, cdr } from '../sexpr';
import { is_atom, is_list } from '../sexpr';
import { equals } from '../sexpr';
import { jsonRead } from '../sexpr';

export enum PatternLeafType {
  Variable,
  ZeroOrMore,
  OneOrMore,
}

export type PatternLeaf =
  | { variant: PatternLeafType.Variable; name: string }
  | { variant: PatternLeafType.ZeroOrMore; pattern: Pattern; tail_pattern: Pattern }
  | { variant: PatternLeafType.OneOrMore; pattern: Pattern; tail_pattern: Pattern };

export type Pattern = SListStruct<PatternLeaf>;
export type JsonPattern = JsonSExpr<PatternLeaf>;

export function json_var(name: string): JsonPattern {
  return { boxed: { variant: PatternLeafType.Variable, name } };
}

export function json_star(pattern: JsonPattern, tail_pattern: JsonPattern): JsonPattern {
  return {
    boxed: {
      variant: PatternLeafType.ZeroOrMore,
      pattern: jsonRead(pattern),
      tail_pattern: jsonRead(tail_pattern),
    },
  };
}

export function json_plus(pattern: JsonPattern, tail_pattern: JsonPattern): JsonPattern {
  return {
    boxed: {
      variant: PatternLeafType.OneOrMore,
      pattern: jsonRead(pattern),
      tail_pattern: jsonRead(tail_pattern),
    },
  };
}

export type SpecialForms = 'let' | 'quote';

export interface Form {
  pattern: Pattern;
  form: SpecialForms;
}

export type FormMatches = Record<string, SExpr[]>;

export const special_forms: Record<string, Form[]> = {
  let: [
    {
      pattern: jsonRead([
        'let',
        json_star([json_var('ids'), json_var('val_exprs')], []),
        '.',
        json_plus(json_var('bodies'), []),
      ]),
      form: 'let',
    },
  ],
  quote: [
    {
      pattern: jsonRead(['quote', json_var('e')]),
      form: 'quote',
    },
  ],
};

function add_match(matches: FormMatches, varname: string, match: SExpr) {
  if (!(varname in matches)) {
    matches[varname] = [];
  }
  matches[varname].push(match);
}

export function match(program: SExpr, pattern: Pattern, matches: FormMatches): boolean {
  if (is_boxed(pattern)) {
    // handle pattern leaf
    const pattern_leaf = pattern.val;
    if (pattern_leaf.variant === PatternLeafType.Variable) {
      // match variable
      add_match(matches, pattern_leaf.name, program);
      return true;
    } else if (pattern_leaf.variant === PatternLeafType.ZeroOrMore) {
      // match inner pattern zero or more times, then the tail
      let p = program;
      while (is_list(p) && match(car(p), pattern_leaf.pattern, matches)) {
        p = cdr(p);
      }
      // p no longer matches with the pattern, try to match with tail.
      return match(p, pattern_leaf.tail_pattern, matches);
    } else {
      // if (pattern_leaf.variant === PatternLeafType.OneOrMore) {
      // match inner pattern one or more times, then the tail
      let p = program;
      if (!(is_list(p) && match(car(p), pattern_leaf.pattern, matches))) {
        return false;
      }
      p = cdr(p);
      while (is_list(p) && match(car(p), pattern_leaf.pattern, matches)) {
        p = cdr(p);
      }
      // p no longer matches with the pattern, try to match with tail.
      return match(p, pattern_leaf.tail_pattern, matches);
    }
  }

  // not a pattern leaf, so it's just your regular ol sexpr stuff.
  // we need to structurally match program against the pattern

  // if it's not a list, no recursion is needed, so we delegate to equals
  if (!is_list(pattern)) {
    return equals(program, pattern);
  }

  // pattern is list, recurse on both sides

  // if program isn't a list in the first place we definitely don't match
  if (!is_list(program)) {
    return false;
  }
  return match(car(program), car(pattern), matches) && match(cdr(program), cdr(pattern), matches);
}

export enum MatchType {
  Match,
  InvalidSyntax,
  NoMatch,
}

export type MatchResult =
  | { match_type: MatchType.Match; form: SpecialForms; matches: FormMatches }
  | { match_type: MatchType.InvalidSyntax; form: undefined; matches: undefined }
  | { match_type: MatchType.NoMatch; form: undefined; matches: undefined };

export function match_special_form(program: SList<never>): MatchResult {
  const head = car(program);
  if (!is_atom(head)) {
    return { match_type: MatchType.NoMatch, form: undefined, matches: undefined };
  }
  const keyword = val(head);

  const forms = special_forms[keyword];

  if (forms === undefined) {
    return { match_type: MatchType.NoMatch, form: undefined, matches: undefined };
  }

  for (const form of forms) {
    const matches: FormMatches = {};
    if (match(program, form.pattern, matches)) {
      return { match_type: MatchType.Match, form: form.form, matches };
    }
  }

  return { match_type: MatchType.InvalidSyntax, form: undefined, matches: undefined };
}
