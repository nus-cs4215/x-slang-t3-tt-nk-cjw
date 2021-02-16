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

export interface Quote extends Base {
  type: 'Quote';
}

export function quote(contents: string, loc: Location): Quote {
  return { type: 'Quote', contents, loc };
}

export interface Dot extends Base {
  type: 'Dot';
}

export function dot(contents: string, loc: Location): Dot {
  return { type: 'Dot', contents, loc };
}

export interface Atom extends Base {
  type: 'Atom';
}

export function atom(contents: string, loc: Location): Atom {
  return { type: 'Atom', contents, loc };
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

export type Token = LPar | RPar | Quote | Dot | Atom | Num | Bool | Invalid | EOF;

export function par_match(lpar: LPar, rpar: RPar): boolean {
  return (
    (lpar.contents === '(' && rpar.contents === ')') ||
    (lpar.contents === '[' && rpar.contents === ']') ||
    (lpar.contents === '{' && rpar.contents === '}')
  );
}

function substring_to_token(s: string, loc: Location): Token {
  // Try to interpret as single dot
  if (s.length === 1 && s[0] === '.') {
    return dot('.', loc);
  }

  // Try to interpret as boolean
  if (s[0] === '#') {
    if (s.length !== 2) {
      return invalid(s, loc);
    }
    if (s[1] === 't') {
      return bool('#t', loc);
    } else if (s[1] === 'f') {
      return bool('#f', loc);
    }

    return invalid(s, loc);
  }

  // try to interpret as number
  if (Number.isFinite(Number(s))) {
    return num(s, loc);
  }

  // I guess it's an atom, :P
  return atom(s, loc);
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
      case "'": {
        const contents = s[i];
        inc();
        const end = pos();
        yield quote(contents, { start, end });
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

  const curpos = pos();
  yield eof({ start: curpos, end: curpos });
}
