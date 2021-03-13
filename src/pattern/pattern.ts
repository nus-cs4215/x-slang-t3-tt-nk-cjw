import { JsonSExprT, SExprT } from '../sexpr';
import { car, cdr, equals, is_boxed, is_list, jsonRead } from '../sexpr';

export enum PatternLeafType {
  Variable,
  ZeroOrMore,
  OneOrMore,
}

export type PatternLeaf =
  | { variant: PatternLeafType.Variable; name: string }
  | { variant: PatternLeafType.ZeroOrMore; pattern: Pattern; tail_pattern: Pattern }
  | { variant: PatternLeafType.OneOrMore; pattern: Pattern; tail_pattern: Pattern };

export type Pattern = SExprT<PatternLeaf>;
export type JsonPattern = JsonSExprT<PatternLeaf>;

export type MatchObject<T> = Record<string, SExprT<T>[]>;

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

function add_match<T>(matches: MatchObject<T>, varname: string, match: SExprT<T>) {
  if (!(varname in matches)) {
    matches[varname] = [];
  }
  matches[varname].push(match);
}

export function match<T>(program: SExprT<T>, pattern: Pattern): MatchObject<T> | undefined {
  const matches: MatchObject<T> = {};
  if (match_helper(program, pattern, matches)) {
    return matches;
  } else {
    return undefined;
  }
}

function match_helper<T>(program: SExprT<T>, pattern: Pattern, matches: MatchObject<T>): boolean {
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
      while (is_list(p) && match_helper(car(p), pattern_leaf.pattern, matches)) {
        p = cdr(p);
      }
      // p no longer matches with the pattern, try to match with tail.
      return match_helper(p, pattern_leaf.tail_pattern, matches);
    } else {
      // if (pattern_leaf.variant === PatternLeafType.OneOrMore) {
      // match inner pattern one or more times, then the tail
      let p = program;
      if (!(is_list(p) && match_helper(car(p), pattern_leaf.pattern, matches))) {
        return false;
      }
      p = cdr(p);
      while (is_list(p) && match_helper(car(p), pattern_leaf.pattern, matches)) {
        p = cdr(p);
      }
      // p no longer matches with the pattern, try to match with tail.
      return match_helper(p, pattern_leaf.tail_pattern, matches);
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
  return (
    match_helper(car(program), car(pattern), matches) &&
    match_helper(cdr(program), cdr(pattern), matches)
  );
}
