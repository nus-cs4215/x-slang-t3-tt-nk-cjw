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

function token_to_sexpr(tok: Tok.Dot | Tok.Atom | Tok.Num | Tok.Bool): [SExpr, Location] {
  switch (tok.type) {
    case 'Dot':
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

  // Parse list
  if (firsttok.type === 'LPar') {
    i++;
    const elems = [];
    let tail: SExpr | undefined = undefined;
    while (true) {
      const curtok = tokens[i];

      if (curtok.type === 'RPar') {
        i++;
        // Check that the parens were matched
        if (!par_match(firsttok, curtok)) {
          return err({
            message: 'Mismatched parentheses',
            loc: merge_loc(firsttok.loc, curtok.loc),
          });
        }

        if (elems.length === 0) {
          return ok([snil(), merge_loc(firsttok.loc, curtok.loc), i]);
        } else if (elems.length === 1) {
          return ok([scons(elems[0], tail ?? snil()), merge_loc(firsttok.loc, curtok.loc), i]);
        } else {
          return ok([slist(elems, tail ?? snil()), merge_loc(firsttok.loc, curtok.loc), i]);
        }
      }

      const res = readOneDatum(tokens, i);
      if (isGoodResult(res)) {
        let datum: SExpr;
        let _loc: Location | undefined = undefined;
        _loc; // unused
        [datum, _loc, i] = res.v;
        if (datum._type === 'SAtom' && datum.val === '.') {
          const tailres = readOneDatum(tokens, i);
          if (isGoodResult(tailres)) {
            [tail, _loc, i] = tailres.v;
          } else {
            return tailres;
          }
        } else {
          elems.push(datum);
          tail = undefined;
        }
      } else {
        return res;
      }
    }
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
  return then(readOneDatum([...tokenize(s)]), ([e, loc, i]: [SExpr, Location, number]) => {
    i; // unused argument
    if (e._type === 'SAtom' && e.val === '.') {
      return err({ message: 'Lone dot not allowed at top level', loc });
    }
    return ok(e);
  });
}
