export interface SAtom {
  _type: 'SAtom';
  val: string;
}

export interface SNumber {
  _type: 'SNumber';
  val: number;
}

export interface SBoolean {
  _type: 'SBoolean';
  val: boolean;
}

export interface SNil {
  _type: 'SNil';
}

enum SListVariants {
  PAIR,
}

interface SListBase {
  _type: 'SList';
  _variant: SListVariants;
}

interface SListPair extends SListBase {
  _variant: SListVariants.PAIR;

  x: SExpr;
  y: SExpr;
}

export type SList = SListPair;

export type SExpr = SAtom | SNumber | SBoolean | SNil | SList;

export const satom = (val: string): SAtom => ({ _type: 'SAtom', val });
export const snumber = (val: number): SNumber => ({ _type: 'SNumber', val });
export const sboolean = (val: boolean): SBoolean => ({
  _type: 'SBoolean',
  val,
});

export const snil = (): SNil => ({ _type: 'SNil' });
export const scons = (x: SExpr, y: SExpr): SList => ({
  _type: 'SList',
  _variant: SListVariants.PAIR,
  x,
  y,
});

export function slist(xs: [SExpr, ...SExpr[]], tail: SExpr): SList;
export function slist(xs: SExpr[], tail: SExpr): SExpr;
export function slist(xs: SExpr[], tail: SExpr): SExpr {
  let p: SExpr = tail;
  for (let i = xs.length - 1; i >= 0; i--) {
    p = scons(xs[i], p);
  }
  return p;
}

export const car = (p: SList): SExpr => p.x;
export const cdr = (p: SList): SExpr => p.y;

export function* sconslist_iterator(p: SList): Iterable<SExpr | '.'> & Iterator<SExpr | '.'> {
  let e: SExpr;
  for (e = p; e._type === 'SList'; e = cdr(e)) {
    yield car(e);
  }
  if (e._type !== 'SNil') {
    yield '.';
    yield e;
  }
}

export function equals<E2 extends SExpr>(e1: SExpr, e2: E2): e1 is E2;
export function equals<E1 extends SExpr>(e1: E1, e2: SExpr): e2 is E1;
export function equals(e1: SExpr, e2: SExpr): boolean {
  while (true) {
    if (e1._type === 'SAtom' && e2._type === 'SAtom') {
      return e1.val === e2.val;
    } else if (e1._type === 'SNumber' && e2._type === 'SNumber') {
      return e1.val === e2.val;
    } else if (e1._type === 'SBoolean' && e2._type === 'SBoolean') {
      return e1.val === e2.val;
    } else if (e1._type === 'SNil' && e2._type === 'SNil') {
      return true;
    } else if (e1._type === 'SList' && e2._type === 'SList') {
      if (!equals(car(e1), car(e2))) {
        return false;
      }
      e1 = cdr(e1);
      e2 = cdr(e2);
    } else {
      return false;
    }
  }
}

export type JsonSExpr = JsonSExpr[] | string | number | boolean;
