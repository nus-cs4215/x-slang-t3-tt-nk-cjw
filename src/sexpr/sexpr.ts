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

export interface SCons<T, U> {
  _type: STypes.List;
  x: T;
  y: U;
}

interface SBoxedF<T> {
  _type: STypes.Boxed;
  val: T;
}

export type SBoxed<T> = T extends never ? never : SBoxedF<T>;

export type SExprBase<T> = SSymbol | SNumber | SBoolean | SNil | SBoxed<T>;

export type SNonemptyHomList<T> = SCons<T, SHomList<T>>;
export type SHomList<T> = SNil | SNonemptyHomList<T>;

export type SList<T> = SCons<SExprT<T>, SExprT<T>>;

export type SExprT<T> = SExprBase<T> | SCons<SExprT<T>, SExprT<T>>;
export type SExpr = SExprT<never>;

/****************
 * CONSTRUCTORS *
 ****************/

export const ssymbol = <V extends string>(val: V): SSymbol & { val: V } => ({
  _type: STypes.Symbol,
  val,
});
export const snumber = (val: number): SNumber => ({ _type: STypes.Number, val });
export const sboolean = (val: boolean): SBoolean => ({
  _type: STypes.Boolean,
  val,
});

export const snil = (): SNil => ({ _type: STypes.Nil });
export const scons = <T, U>(x: T, y: U): SCons<T, U> => ({
  _type: STypes.List,
  x,
  y,
});

type TupleTail<T> = T extends readonly [infer U_, ...infer V] ? V : [];

type SListReturnValue<
  T,
  Xs extends readonly [...SExprT<T>[]],
  Tail extends SExprT<T>
> = Xs['length'] extends 0 ? Tail : SCons<Xs[0], SListReturnValue<T, TupleTail<Xs>, Tail>>;

export function slist<T, Xs extends readonly [...SExprT<T>[]], Tail extends SExprT<T>>(
  xs: Xs,
  tail: Tail
): SListReturnValue<T, Xs, Tail>;
export function slist<T, U>(xs: [T, ...SExprT<U>[]], tail: SExprT<U>): SCons<T, SExprT<U>>;
export function slist<T>(xs: SExprT<T>[], tail: SExprT<T>): SExprT<T>;
export function slist<T>(xs: SExprT<T>[], tail: SExprT<T>): SExprT<T> {
  return xs.reduceRight((p, x) => scons(x, p), tail);
}

export const sbox = <T>(val: T): SBoxed<T> =>
  ({ _type: STypes.Boxed, val } as T extends never ? never : { _type: STypes.Boxed; val: T });

/*************
 * ACCESSORS *
 *************/

export function val<T, E extends SSymbol | SNumber | SBoolean | SBoxed<T>>(e: E): E['val'] {
  return e.val;
}
export const car = <T, U, P extends SCons<T, U>>(p: P): P['x'] => p.x;
export const cdr = <T, U, P extends SCons<T, U>>(p: P): P['y'] => p.y;

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
