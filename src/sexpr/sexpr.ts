/*********
 * TYPES *
 *********/

export enum STypes {
  Atom,
  Number,
  Boolean,
  Nil,
  List,
  Boxed,
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

interface SListPair<T> extends SListBase {
  _variant: SListVariants.PAIR;

  x: SListStruct<T>;
  y: SListStruct<T>;
}

export interface SBoxed<T> {
  _type: STypes.Boxed;
  val: T;
}

export type SList<T> = SListPair<T>;
export type SListStruct<T> = SExprBase<T> | SList<T>;

export type SExprBase<T> =
  | SAtom
  | SNumber
  | SBoolean
  | SNil
  | (T extends never ? never : SBoxed<T>);

export type SExpr = SListStruct<never>;

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
export const scons = <T>(x: SListStruct<T>, y: SListStruct<T>): SList<T> => ({
  _type: STypes.List,
  _variant: SListVariants.PAIR,
  x,
  y,
});

export function slist<T>(xs: [SListStruct<T>, ...SListStruct<T>[]], tail: SListStruct<T>): SList<T>;
export function slist<T>(xs: SListStruct<T>[], tail: SListStruct<T>): SListStruct<T>;
export function slist<T>(xs: SListStruct<T>[], tail: SListStruct<T>): SListStruct<T> {
  return xs.reduceRight((p, x) => scons(x, p), tail);
}

export const sbox = <T>(val: T): SBoxed<T> => ({ _type: STypes.Boxed, val });

/*************
 * ACCESSORS *
 *************/

export function val(e: SAtom): string;
export function val(e: SNumber): number;
export function val(e: SBoolean): boolean;
export function val(e: SAtom | SNumber): string | number;
export function val(e: SAtom | SBoolean): string | boolean;
export function val(e: SNumber | SBoolean): number | boolean;
export function val(e: SAtom | SNumber | SBoolean): string | number | boolean;
export function val<T>(e: SBoxed<T>): T;
export function val<T>(e: SAtom | SBoxed<T>): string | T;
export function val<T>(e: SNumber | SBoxed<T>): number | T;
export function val<T>(e: SBoolean | SBoxed<T>): boolean | T;
export function val<T>(e: SAtom | SNumber | SBoxed<T>): string | number | T;
export function val<T>(e: SAtom | SBoolean | SBoxed<T>): string | boolean | T;
export function val<T>(e: SNumber | SBoolean | SBoxed<T>): number | boolean | T;
export function val<T>(e: SAtom | SNumber | SBoolean | SBoxed<T>): string | number | boolean | T;
export function val<T>(e: SAtom | SNumber | SBoolean | SBoxed<T>): string | number | boolean | T {
  return e.val;
}
export const car = <T>(p: SList<T>): SListStruct<T> => p.x;
export const cdr = <T>(p: SList<T>): SListStruct<T> => p.y;

/**************
 * PREDICATES *
 **************/

export const is_atom = <T>(e: SListStruct<T>): e is SAtom => e._type === STypes.Atom;
export const is_number = <T>(e: SListStruct<T>): e is SNumber => e._type === STypes.Number;
export const is_boolean = <T>(e: SListStruct<T>): e is SBoolean => e._type === STypes.Boolean;
export const is_nil = <T>(e: SListStruct<T>): e is SNil => e._type === STypes.Nil;
export const is_value = <T>(e: SListStruct<T>): e is SNumber | SBoolean =>
  e._type === STypes.Number || e._type === STypes.Boolean;
export const is_list = <T>(e: SListStruct<T>): e is SList<T> => e._type === STypes.List;
export const is_boxed = <T>(e: SListStruct<T>): e is T extends never ? never : SBoxed<T> =>
  e._type === STypes.Boxed;

/*************
 * UTILITIES *
 *************/

export function equals<E2 extends SListStruct<unknown>>(e1: SListStruct<unknown>, e2: E2): e1 is E2;
export function equals<E1 extends SListStruct<unknown>>(e1: E1, e2: SListStruct<unknown>): e2 is E1;
export function equals(e1: SListStruct<unknown>, e2: SListStruct<unknown>): boolean {
  for (;;) {
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
      // Note: boxes always compare false, because we don't have a way to compare them.
      return false;
    }
  }
}
