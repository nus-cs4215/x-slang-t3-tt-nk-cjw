import { Position, Location } from '../utils/location';

export interface Base {
  type: string;
  contents: string;
  loc: Location;
}

export interface LPar extends Base {
  type: 'LPar';
}

export function lpar(contents: string, loc: Location): LPar {
  return { type: 'LPar', contents, loc };
}

export interface RPar extends Base {
  type: 'RPar';
}

export function rpar(contents: string, loc: Location): RPar {
  return { type: 'RPar', contents, loc };
}

export interface QuoteLike extends Base {
  type: 'QuoteLike';
}

export function quote_like(contents: string, loc: Location): QuoteLike {
  return { type: 'QuoteLike', contents, loc };
}

export interface Dot extends Base {
  type: 'Dot';
}

export function dot(contents: string, loc: Location): Dot {
  return { type: 'Dot', contents, loc };
}

export interface SymbolToken extends Base {
  type: 'Symbol';
}

export function symbol_token(contents: string, loc: Location): SymbolToken {
  return { type: 'Symbol', contents, loc };
}

export interface Num extends Base {
  type: 'Num';
}

export function num(contents: string, loc: Location): Num {
  return { type: 'Num', contents, loc };
}

export interface Bool extends Base {
  type: 'Bool';
}

export function bool(contents: string, loc: Location): Bool {
  return { type: 'Bool', contents, loc };
}

export interface SExprComment extends Base {
  type: 'SExprComment';
}

export function sexprcomment(contents: string, loc: Location): SExprComment {
  return { type: 'SExprComment', contents, loc };
}

export interface Invalid extends Base {
  type: 'Invalid';
}

export function invalid(contents: string, loc: Location): Invalid {
  return { type: 'Invalid', contents, loc };
}

export interface EOF extends Base {
  type: 'EOF';
  contents: '';
}

export function eof(loc: Location): EOF {
  return { type: 'EOF', contents: '', loc };
}

export type Token =
  | LPar
  | RPar
  | QuoteLike
  | Dot
  | SymbolToken
  | Num
  | Bool
  | SExprComment
  | Invalid
  | EOF;

export function par_match(lpar: LPar, rpar: RPar): boolean {
  return (
    (lpar.contents === '(' && rpar.contents === ')') ||
    (lpar.contents === '[' && rpar.contents === ']') ||
    (lpar.contents === '{' && rpar.contents === '}')
  );
}

function substring_to_token(s: string, loc: Location): Token {
  // Interpret special cases
  switch (s) {
    case '.':
      return dot('.', loc);
    case '+inf.0':
    case '+inf.f':
      return num('Infinity', loc);
    case '-inf.0':
    case '-inf.f':
      return num('-Infinity', loc);
    case '+nan.0':
    case '+nan.f':
    case '-nan.0':
    case '-nan.f':
      return num('NaN', loc);
  }

  // Try to interpret as number
  if (Number.isFinite(Number(s))) {
    return num(s, loc);
  }

  // I guess it's a symbol, :P
  return symbol_token(s, loc);
}

const ws_regex = /\s/;
const delim_regex = /\s|[()[\]{}",'`;]/;

export function* tokenize(s: string): Iterable<Token> & Iterator<Token> {
  let i = 0;
  let line = 1;
  let column = 0;

  function inc(): void {
    if (s[i] === '\n') {
      line++;
      column = 0;
      i++;
    } else {
      column++;
      i++;
    }
  }

  function pos(): Position {
    return {
      character: i,
      line,
      column,
    };
  }

  while (true) {
    if (i === s.length) {
      const curpos = pos();
      yield eof({ start: curpos, end: curpos });
      return;
    }

    // strip whitespace
    while (ws_regex.test(s[i])) {
      inc();
      if (i === s.length) {
        const curpos = pos();
        yield eof({ start: curpos, end: curpos });
        return;
      }
    }

    const start = pos();
    // Read delimiter character
    switch (s[i]) {
      case '(':
      case '[':
      case '{': {
        const contents = s[i];
        inc();
        const end = pos();
        yield lpar(contents, { start, end });
        continue;
      }
      case ')':
      case ']':
      case '}': {
        const contents = s[i];
        inc();
        const end = pos();
        yield rpar(contents, { start, end });
        continue;
      }
      case "'":
      case '`':
      case ',': {
        const contents = s[i];
        inc();
        const end = pos();
        yield quote_like(contents, { start, end });
        continue;
      }
      case ';': {
        // line comment, skip to end of line
        while (s[i] !== '\n') {
          inc();
          if (i === s.length) {
            const curpos = pos();
            yield eof({ start: curpos, end: curpos });
            return;
          }
        }
        continue;
      }
      case '#': {
        // special dispatch

        const j = i;
        // one character dispatches
        inc();
        inc();
        const contents = s.slice(j, i);
        const end = pos();
        switch (contents[1]) {
          case 't':
          case 'f': {
            yield bool(contents, { start, end });
            continue;
          }
          case ';': {
            yield sexprcomment(contents, { start, end });
            continue;
          }
        }

        // dispatch not supported, output invalid
        yield invalid(contents, { start, end });
        continue;
      }
    }

    // Try to read a symbol
    const j = i;
    while (!delim_regex.test(s[i])) {
      inc();
      if (i === s.length) {
        break;
      }
    }

    const contents = s.slice(j, i);
    const end = pos();
    yield substring_to_token(contents, { start, end });
  }
}
