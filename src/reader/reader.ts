import { Result, isGoodResult, ok, err, then } from '../utils';
import { SExpr, satom, snumber, sboolean, snil, scons, slist } from '../sexpr';

export interface Location {
  character: number;
  line: number;
  column: number;
}

export interface ReadErr {
  message: string;
  start?: Location;
  end?: Location;
}

export type PartialReadResult = Result<[SExpr, number], ReadErr>;

export type ReadResult = Result<SExpr, ReadErr>;

interface TokBase {
  type: string;
  contents: string;
  start?: Location;
  end?: Location;
}

interface TokLPar extends TokBase {
  type: 'LPar';
}

function lpar(contents: string, start?: Location, end?: Location): TokLPar {
  return { type: 'LPar', contents, start, end };
}

interface TokRPar extends TokBase {
  type: 'RPar';
}

function rpar(contents: string, start?: Location, end?: Location): TokRPar {
  return { type: 'RPar', contents, start, end };
}

interface TokQuote extends TokBase {
  type: 'Quote';
}

function quote(contents: string, start?: Location, end?: Location): TokQuote {
  return { type: 'Quote', contents, start, end };
}

interface TokDot extends TokBase {
  type: 'Dot';
}

function dot(contents: string, start?: Location, end?: Location): TokDot {
  return { type: 'Dot', contents, start, end };
}

interface TokAtom extends TokBase {
  type: 'Atom';
}

function atom(contents: string, start?: Location, end?: Location): TokAtom {
  return { type: 'Atom', contents, start, end };
}

interface TokNum extends TokBase {
  type: 'Num';
}

function num(contents: string, start?: Location, end?: Location): TokNum {
  return { type: 'Num', contents, start, end };
}

interface TokBool extends TokBase {
  type: 'Bool';
}

function bool(contents: string, start?: Location, end?: Location): TokBool {
  return { type: 'Bool', contents, start, end };
}

interface TokInvalid extends TokBase {
  type: 'Invalid';
}

function invalid(contents: string, start?: Location, end?: Location): TokInvalid {
  return { type: 'Invalid', contents, start, end };
}

interface TokEOF extends TokBase {
  type: 'EOF';
  contents: '';
}

function eof(start?: Location): TokEOF {
  return { type: 'EOF', contents: '', start, end: start };
}

type Token =
  | TokLPar
  | TokRPar
  | TokQuote
  | TokDot
  | TokAtom
  | TokNum
  | TokBool
  | TokInvalid
  | TokEOF;

const ws_regex = /\s/;
const delim_regex = /\s|[()[\]{}",'`;]/;

function par_match(lpar: TokLPar, rpar: TokRPar): boolean {
  return (
    (lpar.contents === '(' && rpar.contents === ')') ||
    (lpar.contents === '[' && rpar.contents === ']') ||
    (lpar.contents === '{' && rpar.contents === '}')
  );
}

function substring_to_token(s: string): Token {
  // Try to interpret as single dot
  if (s.length === 1 && s[0] === '.') {
    return dot('.');
  }

  // Try to interpret as boolean
  if (s[0] === '#') {
    if (s.length !== 2) {
      return invalid(s);
    }
    if (s[1] === 't') {
      return bool('#t');
    } else if (s[1] === 'f') {
      return bool('#f');
    }

    return invalid(s);
  }

  // try to interpret as number
  if (Number.isFinite(Number(s))) {
    return num(s);
  }

  // I guess it's an atom, :P
  return atom(s);
}

function token_to_sexpr(tok: TokDot | TokAtom | TokNum | TokBool): SExpr {
  switch (tok.type) {
    case 'Dot':
    case 'Atom': {
      return satom(tok.contents);
    }
    case 'Num': {
      return snumber(Number.parseFloat(tok.contents));
    }
    case 'Bool': {
      return sboolean(tok.contents === '#t');
    }
  }
}

function* tokenize(s: string, i: number = 0): Iterable<Token> & Iterator<Token> {
  while (true) {
    if (i === s.length) {
      yield eof();
      return;
    }

    // strip whitespace
    while (ws_regex.test(s[i])) {
      i++;
      if (i === s.length) {
        yield eof();
        return;
      }
    }

    // Read delimiter character
    switch (s[i]) {
      case '(':
      case '[':
      case '{': {
        yield lpar(s[i]);
        i++;
        continue;
      }
      case ')':
      case ']':
      case '}': {
        yield rpar(s[i]);
        i++;
        continue;
      }
      case "'": {
        yield quote(s[i]);
        i++;
        continue;
      }
      case ';': {
        // line comment, skip to end of line
        while (s[i] !== '\n') {
          i++;
          if (i === s.length) {
            yield eof();
            return;
          }
        }
        continue;
      }
    }

    // Try to read a symbol
    const j = i;
    while (!delim_regex.test(s[i])) {
      i++;
      if (i === s.length) {
        break;
      }
    }

    yield substring_to_token(s.slice(j, i));
  }
  yield eof();
}

export function readOneDatum(tokens: Token[], i: number = 0): PartialReadResult {
  const firsttok = tokens[i];

  if (firsttok.type === 'EOF') {
    return err({ message: 'Unexpected EOF' });
  }

  if (firsttok.type === 'Invalid') {
    return err({ message: 'Invalid token' });
  }

  if (firsttok.type === 'RPar') {
    return err({ message: 'Unexpected parenthesis' });
  }

  // Parse list
  if (firsttok.type === 'LPar') {
    i++;
    const elems = [];
    let tail: SExpr = snil();
    while (true) {
      const curtok = tokens[i];

      if (curtok.type === 'RPar') {
        i++;
        // Check that the parens were matched
        if (!par_match(firsttok, curtok)) {
          return err({ message: 'Mismatched parentheses' });
        }

        if (elems.length === 0) {
          return ok([snil(), i]);
        } else if (elems.length === 1) {
          return ok([scons(elems[0], tail), i]);
        } else {
          return ok([slist(elems, tail), i]);
        }
      }

      const res = readOneDatum(tokens, i);
      if (isGoodResult(res)) {
        let datum: SExpr;
        [datum, i] = res.v;
        if (datum._type === 'SAtom' && datum.val === '.') {
          const tailres = readOneDatum(tokens, i);
          if (isGoodResult(tailres)) {
            [tail, i] = res.v;
          } else {
            return tailres;
          }
        } else {
          elems.push(datum);
          tail = snil();
        }
      } else {
        return res;
      }
    }
  }

  // Parse quoted
  if (firsttok.type === 'Quote') {
    return then(readOneDatum(tokens, i + 1), ([e, i]) =>
      ok([slist([satom('quote'), e], snil()), i])
    );
  }

  // Everything else is just itself
  return ok([token_to_sexpr(firsttok), i + 1]);
}

export function read(s: string): ReadResult {
  return then(readOneDatum([...tokenize(s)], 0), ([e, i]: [SExpr, number]) => {
    i; // unused argument
    if (e._type === 'SAtom' && e.val === '.') {
      return err({ message: 'Lone dot not allowed at top level' });
    }
    return ok(e);
  });
}
