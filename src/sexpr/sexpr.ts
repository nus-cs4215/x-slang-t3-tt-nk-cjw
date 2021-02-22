/*********
 * TYPES *
 *********/

export enum STypes {
  Symbol,
  Number,
  Boolean,
  Nil,
  List,
  Boxed,
}

export interface SSymbol {
  _type: STypes.Symbol;
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

  x: SExprT<T>;
  y: SExprT<T>;
}

export type SList<T> = SListPair<T>;

interface SBoxedF<T> {
  _type: STypes.Boxed;
  val: T;
}

export type SBoxed<T> = T extends never ? never : SBoxedF<T>;

export type SExprBase<T> = SSymbol | SNumber | SBoolean | SNil | SBoxed<T>;

export type SExprT<T> = SExprBase<T> | SList<T>;
export type SExpr = SExprT<never>;

/****************
 * CONSTRUCTORS *
 ****************/

export const ssymbol = (val: string): SSymbol => ({ _type: STypes.Symbol, val });
export const snumber = (val: number): SNumber => ({ _type: STypes.Number, val });
export const sboolean = (val: boolean): SBoolean => ({
  _type: STypes.Boolean,
  val,
});

export const snil = (): SNil => ({ _type: STypes.Nil });
export const scons = <T>(x: SExprT<T>, y: SExprT<T>): SList<T> => ({
  _type: STypes.List,
  _variant: SListVariants.PAIR,
  x,
  y,
});

export function slist<T>(xs: [SExprT<T>, ...SExprT<T>[]], tail: SExprT<T>): SList<T>;
export function slist<T>(xs: SExprT<T>[], tail: SExprT<T>): SExprT<T>;
export function slist<T>(xs: SExprT<T>[], tail: SExprT<T>): SExprT<T> {
  return xs.reduceRight((p, x) => scons(x, p), tail);
}

export const sbox = <T>(val: T): SBoxed<T> =>
  ({ _type: STypes.Boxed, val } as T extends never ? never : { _type: STypes.Boxed; val: T });

/*************
 * ACCESSORS *
 *************/

export function val(e: SSymbol): string;
export function val(e: SNumber): number;
export function val(e: SBoolean): boolean;
export function val(e: SSymbol | SNumber): string | number;
export function val(e: SSymbol | SBoolean): string | boolean;
export function val(e: SNumber | SBoolean): number | boolean;
export function val(e: SSymbol | SNumber | SBoolean): string | number | boolean;
export function val<T>(e: SBoxed<T>): T;
export function val<T>(e: SSymbol | SBoxed<T>): string | T;
export function val<T>(e: SNumber | SBoxed<T>): number | T;
export function val<T>(e: SBoolean | SBoxed<T>): boolean | T;
export function val<T>(e: SSymbol | SNumber | SBoxed<T>): string | number | T;
export function val<T>(e: SSymbol | SBoolean | SBoxed<T>): string | boolean | T;
export function val<T>(e: SNumber | SBoolean | SBoxed<T>): number | boolean | T;
export function val<T>(e: SSymbol | SNumber | SBoolean | SBoxed<T>): string | number | boolean | T;
export function val<T>(e: SSymbol | SNumber | SBoolean | SBoxed<T>): string | number | boolean | T {
  return e.val;
}
export const car = <T>(p: SList<T>): SExprT<T> => p.x;
export const cdr = <T>(p: SList<T>): SExprT<T> => p.y;

/**************
 * PREDICATES *
 **************/

export const is_symbol = <T>(e: SExprT<T>): e is SSymbol => e._type === STypes.Symbol;
export const is_number = <T>(e: SExprT<T>): e is SNumber => e._type === STypes.Number;
export const is_boolean = <T>(e: SExprT<T>): e is SBoolean => e._type === STypes.Boolean;
export const is_nil = <T>(e: SExprT<T>): e is SNil => e._type === STypes.Nil;
export const is_value = <T>(e: SExprT<T>): e is SNumber | SBoolean =>
  e._type === STypes.Number || e._type === STypes.Boolean;
export const is_list = <T>(e: SExprT<T>): e is SList<T> => e._type === STypes.List;
export const is_boxed = <T>(e: SExprT<T>): e is SBoxed<T> => e._type === STypes.Boxed;

/*************
 * UTILITIES *
 *************/

export function equals<E2 extends SExprT<unknown>>(e1: SExprT<unknown>, e2: E2): e1 is E2;
export function equals<E1 extends SExprT<unknown>>(e1: E1, e2: SExprT<unknown>): e2 is E1;
export function equals(e1: SExprT<unknown>, e2: SExprT<unknown>): boolean {
  for (;;) {
    if (
      (e1._type === STypes.Symbol || e1._type === STypes.Number || e1._type === STypes.Boolean) &&
      (e2._type === STypes.Symbol || e2._type === STypes.Number || e2._type === STypes.Boolean)
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
