import { EvalSExpr, EvalResult } from './types';
import { Environment } from '../environment';

export enum EvalDataType {
  Closure,
  Primitive,
}

export interface Closure {
  variant: EvalDataType.Closure;
  env: Environment;
  params: string[];
  body: EvalSExpr[];
}

export interface Primitive {
  variant: EvalDataType.Primitive;
  fun: (...args: EvalSExpr[]) => EvalResult;
}

export type EvalData = Closure | Primitive;

export const make_closure = (env: Environment, params: string[], body: EvalSExpr[]): Closure => ({
  variant: EvalDataType.Closure,
  env,
  params,
  body,
});

export const make_primitive = (fun: (...args: EvalSExpr[]) => EvalResult): Primitive => ({
  variant: EvalDataType.Primitive,
  fun,
});

export function is_function_variant(object: any): object is EvalData {
  return object.variant === EvalDataType.Closure || object.variant === EvalDataType.Primitive;
}
