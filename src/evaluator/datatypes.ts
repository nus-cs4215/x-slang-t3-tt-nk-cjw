import { EvalValue, EvalResult } from './types';
import { Environment } from './environment';
import { SExpr } from '../sexpr';

export enum EvalDataType {
  Closure,
  Primitive,
}

export interface Closure {
  variant: EvalDataType.Closure;
  env: Environment | undefined;
  params: string[];
  body: SExpr[];
}

export interface Primitive {
  variant: EvalDataType.Primitive;
  fun: (...args: EvalValue[]) => EvalResult;
}

export type EvalData = Closure | Primitive;

export const make_closure = (
  env: Environment | undefined,
  params: string[],
  body: SExpr[]
): Closure => ({ variant: EvalDataType.Closure, env, params, body });

export const make_primitive = (fun: (...args: EvalValue[]) => EvalResult): Primitive => ({
  variant: EvalDataType.Primitive,
  fun,
});

export function instanceOfEvalData(object: any): object is EvalData {
  // (<any>EvalDataType) is adapted from https://blog.oio.de/2014/02/28/typescript-accessing-enum-values-via-a-string/
  return Object.keys(EvalDataType).reduce(
    (prev, curr) => object.variant === (<any>EvalDataType)[curr] || prev,
    false
  );
}
