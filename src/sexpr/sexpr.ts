export interface SBase {
  type: string;
}

export interface SAtom extends SBase {
  type: 'SAtom';
  val: string;
}

export interface SNumber extends SBase {
  type: 'SNumber';
  val: number;
}

export interface SBoolean extends SBase {
  type: 'SBoolean';
  val: boolean;
}

export interface SNil extends SBase {
  type: 'SNil';
}

export interface SCons<T, U> extends SBase {
  type: 'SCons';
  first: T;
  rest: U;
}

export type SConsList<T, U> = SCons<T, SConsList<T, U>> | SCons<T, U>;

export interface SList<T, U> extends SBase {
  // A more efficient representation of cons lists
  type: 'SList';
  elems: T[];
  tail: U;
}

export type SExpr = SAtom | SNumber | SBoolean | SNil | SCons<SExpr, SExpr> | SList<SExpr, SExpr>;

export const satom = (val: string): SAtom => ({ type: 'SAtom', val });
export const snumber = (val: number): SNumber => ({ type: 'SNumber', val });
export const sboolean = (val: boolean): SBoolean => ({ type: 'SBoolean', val });
export const snil = (): SNil => ({ type: 'SNil' });
export const scons = <T, U>(first: T, rest: U): SCons<T, U> => ({ type: 'SCons', first, rest });
export const slist = <T, U>(elems: T[], tail: U): SList<T, U> => ({ type: 'SList', elems, tail });

export function* sconslist_iterator(
  e: SList<SExpr, SExpr> | SCons<SExpr, SExpr>
): Iterable<SExpr> & Iterator<SExpr> {
  while (true) {
    let rest: SExpr;
    if (e.type === 'SList') {
      yield* e.elems;
      rest = e.tail;
    } else {
      yield e.first;
      rest = e.rest;
    }
    if (rest.type == 'SList' || rest.type == 'SCons') {
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
    if (e1.type === 'SAtom' && e2.type === 'SAtom') {
      return e1.val === e2.val;
    } else if (e1.type === 'SNumber' && e2.type === 'SNumber') {
      return e1.val === e2.val;
    } else if (e1.type === 'SBoolean' && e2.type === 'SBoolean') {
      return e1.val === e2.val;
    } else if (e1.type === 'SNil' && e2.type === 'SNil') {
      return true;
    } else if (e1.type === 'SCons' && e2.type === 'SCons') {
      if (!equals(e1.first, e2.first)) {
        return false;
      }
      e1 = e1.rest;
      e2 = e2.rest;
      continue;
    } else if (
      (e1.type === 'SCons' || e1.type === 'SList') &&
      (e2.type == 'SCons' || e2.type == 'SList')
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
