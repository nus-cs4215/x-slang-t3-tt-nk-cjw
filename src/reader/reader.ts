import { Result, isGoodResult, ok, err, then } from '../utils';
import { SExpr, satom, snumber, sboolean, snil, scons, slist } from '../sexpr';
import * as Tok from './token';
import { Token, tokenize, par_match } from './token';
import { Location, merge_loc, format_loc, highlight_loc } from '../utils/location';

export interface ReadErr {
  message: string;
  loc: Location;
}

export type PartialReadResult = Result<[SExpr, Location, number], ReadErr>;

export type ReadResult = Result<SExpr, ReadErr>;

export function formatReadErr(err: ReadErr, s: string) {
  return `Read error at ${format_loc(err.loc)}: ${err.message}
${highlight_loc(err.loc, s, '  ')}
`;
}

function token_to_sexpr(tok: Tok.Atom | Tok.Num | Tok.Bool): [SExpr, Location] {
  switch (tok.type) {
    case 'Atom': {
      return [satom(tok.contents), tok.loc];
    }
    case 'Num': {
      return [snumber(Number.parseFloat(tok.contents)), tok.loc];
    }
    case 'Bool': {
      return [sboolean(tok.contents === '#t'), tok.loc];
    }
  }
}

function readList(firsttok: Tok.LPar, tokens: Token[], i: number): PartialReadResult {
  const data1: SExpr[] = [];
  let firstdot: Tok.Dot | undefined = undefined;
  const data2: SExpr[] = [];
  let seconddot: Tok.Dot | undefined = undefined;
  const data3: SExpr[] = [];

  // Stage 1, no . seen yet
  while (true) {
    const curtok = tokens[i];

    // Ending at stage 1, no . in this list
    if (curtok.type === 'RPar') {
      i++;
      // Check that the parens were matched
      if (!par_match(firsttok, curtok)) {
        return err({
          message: 'Mismatched parentheses',
          loc: merge_loc(firsttok.loc, curtok.loc),
        });
      }

      if (data1.length === 0) {
        return ok([snil(), merge_loc(firsttok.loc, curtok.loc), i]);
      } else if (data1.length === 1) {
        return ok([scons(data1[0], snil()), merge_loc(firsttok.loc, curtok.loc), i]);
      } else {
        return ok([slist(data1, snil()), merge_loc(firsttok.loc, curtok.loc), i]);
      }
    }

    if (curtok.type === 'Dot') {
      if (data1.length === 0) {
        // Nothing before the . is illegal
        return err({
          message: 'Unexpected dot, missing LHS of cons literal or infix list',
          loc: merge_loc(firsttok.loc, curtok.loc),
        });
      }

      // Move to next stage
      firstdot = curtok;
      i++;
      break;
    }

    const res = readOneDatum(tokens, i);
    if (isGoodResult(res)) {
      let datum: SExpr;
      let _loc: Location | undefined = undefined;
      _loc; // unused
      [datum, _loc, i] = res.v;
      data1.push(datum);
    } else {
      return res;
    }
  }

  // Stage 2, one . seen
  while (true) {
    const curtok = tokens[i];

    // Ending at stage 2, one . in this list
    if (curtok.type === 'RPar') {
      if (data2.length === 0) {
        // Nothing coming after the . is illegal
        return err({
          message: 'Unexpected parenthesis, missing RHS of cons literal',
          loc: curtok.loc,
        });
      } else if (data2.length !== 1) {
        // More than 1 datum after the . is also illegal
        return err({
          message: 'Too much data on the RHS of cons literal',
          loc: merge_loc(firstdot.loc, curtok.loc),
        });
      }

      i++;
      // Check that the parens were matched
      if (!par_match(firsttok, curtok)) {
        return err({
          message: 'Mismatched parentheses',
          loc: merge_loc(firsttok.loc, curtok.loc),
        });
      }

      if (data1.length === 1) {
        return ok([scons(data1[0], data2[0]), merge_loc(firsttok.loc, curtok.loc), i]);
      } else {
        return ok([slist(data1, data2[0]), merge_loc(firsttok.loc, curtok.loc), i]);
      }
    }

    if (curtok.type === 'Dot') {
      if (data2.length === 0) {
        // Nothing between the . is illegal
        return err({
          message: 'Unexpected dot, missing data between dots of infix list',
          loc: merge_loc(firstdot.loc, curtok.loc),
        });
      }

      if (data2.length !== 1) {
        // Too many data between the . is illegal too
        return err({
          message: 'Unexpected dot, too many data between dots of infix list',
          loc: merge_loc(firstdot.loc, curtok.loc),
        });
      }

      // Move to next stage
      seconddot = curtok;
      i++;
      break;
    }

    const res = readOneDatum(tokens, i);
    if (isGoodResult(res)) {
      let datum: SExpr;
      let _loc: Location | undefined = undefined;
      _loc; // unused
      [datum, _loc, i] = res.v;
      data2.push(datum);
    } else {
      return res;
    }
  }

  // Stage 3, two . seen
  while (true) {
    const curtok = tokens[i];

    // Ending at stage 3, two . in this list
    if (curtok.type === 'RPar') {
      if (data3.length === 0) {
        // Nothing coming after the . is illegal
        return err({
          message: 'Unexpected parenthesis, missing RHS of infix list',
          loc: merge_loc(seconddot.loc, curtok.loc),
        });
      }

      i++;
      // Check that the parens were matched
      if (!par_match(firsttok, curtok)) {
        return err({
          message: 'Mismatched parentheses',
          loc: merge_loc(firsttok.loc, curtok.loc),
        });
      }

      const data = [...data2, ...data1, ...data3];
      return ok([slist(data, snil()), merge_loc(firsttok.loc, curtok.loc), i]);
    }

    if (curtok.type === 'Dot') {
      // Too many dots
      return err({
        message: 'Too many dots in infix list',
        loc: curtok.loc,
      });
    }

    const res = readOneDatum(tokens, i);
    if (isGoodResult(res)) {
      let datum: SExpr;
      let _loc: Location | undefined = undefined;
      _loc; // unused
      [datum, _loc, i] = res.v;
      data3.push(datum);
    } else {
      return res;
    }
  }
}

export function readOneDatum(tokens: Token[], i: number = 0): PartialReadResult {
  const firsttok = tokens[i];

  if (firsttok.type === 'EOF') {
    return err({ message: 'Unexpected EOF', loc: firsttok.loc });
  }

  if (firsttok.type === 'Invalid') {
    return err({ message: 'Invalid token', loc: firsttok.loc });
  }

  if (firsttok.type === 'RPar') {
    return err({ message: 'Unexpected parenthesis', loc: firsttok.loc });
  }

  if (firsttok.type === 'Dot') {
    return err({ message: 'Unexpected dot', loc: firsttok.loc });
  }

  // Parse list
  if (firsttok.type === 'LPar') {
    return readList(firsttok, tokens, i + 1);
  }

  // Parse quoted
  if (firsttok.type === 'Quote') {
    return then(readOneDatum(tokens, i + 1), ([e, loc, i]) =>
      ok([slist([satom('quote'), e], snil()), merge_loc(firsttok.loc, loc), i])
    );
  }

  // Everything else is just itself
  return ok([...token_to_sexpr(firsttok), i + 1]);
}

export function read(s: string): ReadResult {
  return then(readOneDatum([...tokenize(s)]), (r: [SExpr, Location, number]) => ok(r[0]));
}
