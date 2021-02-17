/*********
 * TYPES *
 *********/

export enum STypes {
  Atom,
  Number,
  Boolean,
  Nil,
  List,
}

export interface SAtom {
  _type: STypes.Atom;
  val: string;
}

export interface SNumber {
  _type: STypes.Number;
  val: number;
}

export interface SBoolean {
  _type: STypes.Boolean;
  val: boolean;
}

export interface SNil {
  _type: STypes.Nil;
}

enum SListVariants {
  PAIR,
}

interface SListBase {
  _type: STypes.List;
  _variant: SListVariants;
}

interface SListPair extends SListBase {
  _variant: SListVariants.PAIR;

  x: SExpr;
  y: SExpr;
}

export type SList = SListPair;

export type SExpr = SAtom | SNumber | SBoolean | SNil | SList;

/****************
 * CONSTRUCTORS *
 ****************/

export const satom = (val: string): SAtom => ({ _type: STypes.Atom, val });
export const snumber = (val: number): SNumber => ({ _type: STypes.Number, val });
export const sboolean = (val: boolean): SBoolean => ({
  _type: STypes.Boolean,
  val,
});

export const snil = (): SNil => ({ _type: STypes.Nil });
export const scons = (x: SExpr, y: SExpr): SList => ({
  _type: STypes.List,
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

/*************
 * ACCESSORS *
 *************/

export function val(e: SAtom): string;
export function val(e: SNumber): number;
export function val(e: SBoolean): boolean;
export function val(e: SAtom | SNumber | SBoolean): string | number | boolean;
export function val(e: SAtom | SNumber | SBoolean): string | number | boolean {
  return e.val;
}
export const car = (p: SList): SExpr => p.x;
export const cdr = (p: SList): SExpr => p.y;

export function* sconslist_iterator(p: SList): Iterable<SExpr | '.'> & Iterator<SExpr | '.'> {
  let e: SExpr;
  for (e = p; e._type === STypes.List; e = cdr(e)) {
    yield car(e);
  }
  if (e._type !== STypes.Nil) {
    yield '.';
    yield e;
  }
}

/**************
 * PREDICATES *
 **************/

export const is_atom = (e: SExpr): e is SAtom => e._type === STypes.Atom;
export const is_number = (e: SExpr): e is SNumber => e._type === STypes.Number;
export const is_boolean = (e: SExpr): e is SBoolean => e._type === STypes.Boolean;
export const is_nil = (e: SExpr): e is SNil => e._type === STypes.Nil;
export const is_list = (e: SExpr): e is SList => e._type === STypes.List;

/*************
 * UTILITIES *
 *************/

export function equals<E2 extends SExpr>(e1: SExpr, e2: E2): e1 is E2;
export function equals<E1 extends SExpr>(e1: E1, e2: SExpr): e2 is E1;
export function equals(e1: SExpr, e2: SExpr): boolean {
  while (true) {
    if (
      (e1._type === STypes.Atom || e1._type === STypes.Number || e1._type === STypes.Boolean) &&
      (e2._type === STypes.Atom || e2._type === STypes.Number || e2._type === STypes.Boolean)
    ) {
      return val(e1) === val(e2);
    } else if (e1._type === STypes.Nil && e2._type === STypes.Nil) {
      return true;
    } else if (e1._type === STypes.List && e2._type === STypes.List) {
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

export function sexprToJsonsexpr(e: SExpr): JsonSExpr {
  if (e._type === STypes.Atom || e._type === STypes.Number || e._type === STypes.Boolean) {
    return val(e);
  } else if (e._type === STypes.Nil) {
    return [];
  } else {
    // if (e._type === STypes.List) {
    const xs = [];
    xs.push(sexprToJsonsexpr(car(e)));
    e = cdr(e);
    for (; e._type === STypes.List; e = cdr(e)) {
      xs.push(sexprToJsonsexpr(car(e)));
    }
    if (e._type !== STypes.Nil) {
      xs.push('.');
      xs.push(sexprToJsonsexpr(e));
    }
    return xs;
  }
}

export function jsonsexprToSexpr(j: JsonSExpr): SExpr {
  if (typeof j === 'string') {
    return satom(j);
  } else if (typeof j === 'number') {
    return snumber(j);
  } else if (typeof j === 'boolean') {
    return sboolean(j);
  } else {
    // j is a list
    if (j.length === 0) {
      return snil();
    }
    if (j.length >= 3 && j[j.length - 2] === '.') {
      const tail = jsonsexprToSexpr(j.pop()!);
      j.pop();
      return slist(j.map(jsonsexprToSexpr), tail);
    }
  }
  return slist(j.map(jsonsexprToSexpr), snil());
}
