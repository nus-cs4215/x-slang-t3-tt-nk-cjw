export interface SBase {
  _type: string;
}

export interface SAtom extends SBase {
  _type: 'SAtom';
  val: string;
}

export interface SNumber extends SBase {
  _type: 'SNumber';
  val: number;
}

export interface SBoolean extends SBase {
  _type: 'SBoolean';
  val: boolean;
}

export interface SNil extends SBase {
  _type: 'SNil';
}

export interface SCons<T, U> extends SBase {
  _type: 'SCons';
  first: T;
  rest: U;
}

export type SConsList<T, U> = SCons<T, SConsList<T, U>> | SCons<T, U>;

export interface SList<T, U> extends SBase {
  // A more efficient representation of cons lists
  _type: 'SList';
  elems: T[];
  tail: U;
}

export type SExpr = SAtom | SNumber | SBoolean | SNil | SCons<SExpr, SExpr> | SList<SExpr, SExpr>;

export const satom = (val: string): SAtom => ({ _type: 'SAtom', val });
export const snumber = (val: number): SNumber => ({ _type: 'SNumber', val });
export const sboolean = (val: boolean): SBoolean => ({
  _type: 'SBoolean',
  val,
});
export const snil = (): SNil => ({ _type: 'SNil' });
export const scons = <T, U>(first: T, rest: U): SCons<T, U> => ({
  _type: 'SCons',
  first,
  rest,
});
export const slist = <T, U>(elems: T[], tail: U): SList<T, U> => ({
  _type: 'SList',
  elems,
  tail,
});

export function* sconslist_iterator(
  e: SList<SExpr, SExpr> | SCons<SExpr, SExpr>
): Iterable<SExpr> & Iterator<SExpr> {
  while (true) {
    let rest: SExpr;
    if (e._type === 'SList') {
      yield* e.elems;
      rest = e.tail;
    } else {
      yield e.first;
      rest = e.rest;
    }
    if (rest._type === 'SList' || rest._type === 'SCons') {
      e = rest;
    } else {
      yield rest;
      return;
    }
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
    } else if (e1._type === 'SCons' && e2._type === 'SCons') {
      if (!equals(e1.first, e2.first)) {
        return false;
      }
      e1 = e1.rest;
      e2 = e2.rest;
      continue;
    } else if (
      (e1._type === 'SCons' || e1._type === 'SList') &&
      (e2._type === 'SCons' || e2._type === 'SList')
    ) {
      const e1it = sconslist_iterator(e1);
      const e2it = sconslist_iterator(e2);
      while (true) {
        const { value: val1, done: done1 } = e1it.next();
        const { value: val2, done: done2 } = e2it.next();
        if (done1 !== done2) {
          return false;
        }
        if (done1) {
          return true;
        }
        if (!equals(val1!, val2!)) {
          return false;
        }
      }
    } else {
      return false;
    }
  }
}
