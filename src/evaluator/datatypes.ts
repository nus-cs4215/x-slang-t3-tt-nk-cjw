import { Environment, NonemptyEnvironment } from '../environment';
import { EvalSExpr, EvalResult } from './types';

export enum EvalDataType {
  Closure,
  Primitive,
  PrimitiveTransformer,
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

export interface PrimitiveTransformer {
  variant: EvalDataType.PrimitiveTransformer;
  fun: (stx: EvalSExpr, env: Environment) => EvalResult;
}

export type EvalData = Closure | Primitive | PrimitiveTransformer;

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

export const make_primitive_transformer = (
  fun: (stx: EvalSExpr, compile_env: NonemptyEnvironment) => EvalResult
): PrimitiveTransformer => ({
  variant: EvalDataType.PrimitiveTransformer,
  fun,
});

export function is_function_variant(object: any): object is EvalData {
  return object.variant === EvalDataType.Closure || object.variant === EvalDataType.Primitive;
}
