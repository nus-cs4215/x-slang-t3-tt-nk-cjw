import { read, ReadErr } from '../reader';
import { is_symbol, JsonSExprT, sbox, scons, SExpr, SExprT, val } from '../sexpr';
import { car, cdr, equals, is_boxed, is_list, jsonRead } from '../sexpr';
import { get_arguments, ok, Result, then } from '../utils';
import { memoize } from '../utils/memoize';

export enum PatternLeafType {
  Variable,
  SymbolVariable,
  ZeroOrMore,
  OneOrMore,
}

export type PatternLeaf =
  | VariablePatternLeaf
  | SymbolVariablePatternLeaf
  | ZeroOrMorePatternLeaf
  | OneOrMorePatternLeaf;
type VariablePatternLeaf = { variant: PatternLeafType.Variable; name: string };
type SymbolVariablePatternLeaf = { variant: PatternLeafType.SymbolVariable; name: string };
type ZeroOrMorePatternLeaf = {
  variant: PatternLeafType.ZeroOrMore;
  pattern: Pattern;
  tail_pattern: Pattern;
};
type OneOrMorePatternLeaf = {
  variant: PatternLeafType.OneOrMore;
  pattern: Pattern;
  tail_pattern: Pattern;
};

export type Pattern = SExprT<PatternLeaf>;
export type JsonPattern = JsonSExprT<PatternLeaf>;

export type MatchObject<T> = Record<string, SExprT<T>[]>;

export function extract_matches<T, U>(matches: MatchObject<T>, cb: (...args: any) => U): U {
  /***            WARNING             ***/
  /*** THIS FUNCTION USES BLACK MAGIC ***/

  // Specifically, it inspects the argument names of `cb`
  // and uses it to determine which variables the user is trying to extract
  // It's very possible the arguments of cb cannot be extracted for whatever reason
  // (e.g. when trying to use variadic arguments)
  // which will cause this helper function to fail.
  //
  // Seems like for arrow functions, you gotta use at least 2 args, so make a dummy arg called _

  const names = get_arguments(cb);
  const args = [];
  for (const name of names) {
    if (matches[name] === undefined) {
      args.push([]);
    } else {
      args.push(matches[name]);
    }
  }
  return cb(...args);
}

function svar(name: string): VariablePatternLeaf {
  return { variant: PatternLeafType.Variable, name };
}
export function json_var(name: string): JsonPattern {
  return { boxed: svar(name) };
}

function ssymvar(name: string): SymbolVariablePatternLeaf {
  return { variant: PatternLeafType.SymbolVariable, name };
}
export function json_symvar(name: string): JsonPattern {
  return { boxed: ssymvar(name) };
}

function sstar(pattern: Pattern, tail_pattern: Pattern): ZeroOrMorePatternLeaf {
  return {
    variant: PatternLeafType.ZeroOrMore,
    pattern,
    tail_pattern,
  };
}
export function json_star(pattern: JsonPattern, tail_pattern: JsonPattern): JsonPattern {
  return {
    boxed: sstar(jsonRead(pattern), jsonRead(tail_pattern)),
  };
}

function splus(pattern: Pattern, tail_pattern: Pattern): OneOrMorePatternLeaf {
  return {
    variant: PatternLeafType.OneOrMore,
    pattern,
    tail_pattern,
  };
}
export function json_plus(pattern: JsonPattern, tail_pattern: JsonPattern): JsonPattern {
  return {
    boxed: splus(jsonRead(pattern), jsonRead(tail_pattern)),
  };
}

export type PatternParseError = string;

export const read_pattern = memoize(
  (pattern: string): Result<Pattern, ReadErr | PatternParseError> => {
    return then<SExpr, Pattern, ReadErr | PatternParseError>(read(pattern), sexpr_pattern);
  }
);

const literal_pattern = jsonRead(['quote', json_var('literal')]);
const ellipsis_pattern = jsonRead([json_var('star_sexpr'), '...', '.', json_var('rest_sexpr')]);
const ellipsis_plus_pattern = jsonRead([
  json_var('plus_sexpr'),
  '...+',
  '.',
  json_var('rest_sexpr'),
]);
export function sexpr_pattern(pattern: SExpr): Result<Pattern, PatternParseError> {
  const match_literal = match(pattern, literal_pattern);
  if (match_literal !== undefined) {
    return extract_matches(match_literal, (literal: [SExpr]) => ok(literal[0]));
  }
  const match_star = match(pattern, ellipsis_pattern);
  if (match_star !== undefined) {
    return extract_matches(
      match_star,
      (star_sexpr: [SExpr], rest_sexpr: [SExpr]): Result<Pattern, PatternParseError> =>
        then(sexpr_pattern(star_sexpr[0]), (star_pattern) =>
          then(sexpr_pattern(rest_sexpr[0]), (rest_pattern) =>
            ok(sbox(sstar(star_pattern, rest_pattern)))
          )
        )
    );
  }
  const match_plus = match(pattern, ellipsis_plus_pattern);
  if (match_plus !== undefined) {
    return extract_matches(match_plus, (plus_sexpr: [SExpr], rest_sexpr: [SExpr]) =>
      then(sexpr_pattern(plus_sexpr[0]), (plus_pattern) =>
        then(sexpr_pattern(rest_sexpr[0]), (rest_pattern) =>
          ok(sbox(splus(plus_pattern, rest_pattern)))
        )
      )
    );
  }

  if (is_symbol(pattern)) {
    if (val(pattern).startsWith('sym-')) {
      return ok(sbox(ssymvar(val(pattern).substr(4, val(pattern).length - 4))));
    } else {
      return ok(sbox(svar(val(pattern))));
    }
  }

  // Didn't match anything, just match the outermost constructor
  if (is_list(pattern)) {
    // outermost constructor is cons,
    // build up from subpatterns
    return then(sexpr_pattern(car(pattern)), (car_pattern) =>
      then(sexpr_pattern(cdr(pattern)), (cdr_pattern) => ok(scons(car_pattern, cdr_pattern)))
    );
  }

  // outermost constructor is literal, match it
  return ok(pattern);
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
    } else if (pattern_leaf.variant === PatternLeafType.SymbolVariable) {
      // match variable if it's a symbol, else error out
      if (is_symbol(program)) {
        add_match(matches, pattern_leaf.name, program);
        return true;
      } else {
        return false;
      }
    } else if (pattern_leaf.variant === PatternLeafType.ZeroOrMore) {
      // TODO: Fix bug where matches from failed branches are retained
      //       Initial idea for future self:
      //       return an array of matches instead of appending to the matches object.
      //       Then if the branch fails, simply discard this array of matches.
      //       If the branch succeeds, cons it to get a larger array of matches.
      // match inner pattern zero or more times, then the tail
      let p = program;
      while (is_list(p) && match_helper(car(p), pattern_leaf.pattern, matches)) {
        p = cdr(p);
      }
      // p no longer matches with the pattern, try to match with tail.
      return match_helper(p, pattern_leaf.tail_pattern, matches);
    } else {
      // TODO: Fix bug where matches from failed branches are retained
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

export function unmatch<T>(matches: MatchObject<T>, pattern: Pattern): SExprT<T> | undefined {
  if (is_boxed(pattern)) {
    // handle pattern leaf
    const pattern_leaf = pattern.val;
    if (pattern_leaf.variant === PatternLeafType.Variable) {
      // unmatch variable
      if (matches[pattern_leaf.name] === undefined) {
        return undefined;
      }
      if (matches[pattern_leaf.name].length === 0) {
        return undefined;
      }
      // pop from front of array
      return matches[pattern_leaf.name].splice(0, 1)[0];
    } else if (pattern_leaf.variant === PatternLeafType.SymbolVariable) {
      // unmatch variable, just assume it's a symbol
      if (matches[pattern_leaf.name] === undefined) {
        return undefined;
      }
      if (matches[pattern_leaf.name].length === 0) {
        return undefined;
      }
      // pop from front of array
      return matches[pattern_leaf.name].splice(0, 1)[0];
    } else if (pattern_leaf.variant === PatternLeafType.ZeroOrMore) {
      // While unmatch gives us stuff, we build up the list
      const progs: SExprT<T>[] = [];
      for (;;) {
        const prog = unmatch(matches, pattern_leaf.pattern);
        if (prog === undefined) {
          break;
        }
        progs.push(prog);
      }
      // Now we unmatch the tail pattern
      const tail_prog = unmatch(matches, pattern_leaf.tail_pattern);
      if (tail_prog === undefined) {
        return undefined;
      }
      // Now we build up the list
      let prog = tail_prog;
      for (let i = progs.length - 1; i >= 0; i--) {
        prog = scons(progs[i], prog);
      }
      return prog;
    } else {
      // While unmatch gives us stuff, we build up the list
      const progs: SExprT<T>[] = [];
      for (;;) {
        const prog = unmatch(matches, pattern_leaf.pattern);
        if (prog === undefined) {
          break;
        }
        progs.push(prog);
      }
      // Now we unmatch the tail pattern
      const tail_prog = unmatch(matches, pattern_leaf.tail_pattern);
      if (tail_prog === undefined) {
        return undefined;
      }
      // Now we build up the list
      let prog = tail_prog;
      for (let i = progs.length - 1; i >= 0; i--) {
        prog = scons(progs[i], prog);
      }
      return prog;
    }
  }

  // not a pattern leaf, so it's just your regular ol sexpr stuff.
  // we need to structurally match program against the pattern

  // if it's not a list, no recursion is needed, so we delegate to equals
  if (!is_list(pattern)) {
    return pattern;
  }

  // pattern is list, recurse on both sides

  // if program isn't a list in the first place we definitely don't match
  const lhs = unmatch(matches, car(pattern));
  if (lhs === undefined) {
    return lhs;
  }
  const rhs = unmatch(matches, cdr(pattern));
  if (rhs === undefined) {
    return rhs;
  }
  return scons(lhs, rhs);
}
