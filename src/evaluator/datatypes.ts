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
