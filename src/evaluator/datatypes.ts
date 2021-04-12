import { Environment, NonemptyEnvironment } from '../environment';
import { ExprForm } from '../fep-types';
import { SNonemptyHomList } from '../sexpr';
import { CompiledProgram } from '../virtual_machine';
import { EvalResult, EvalSExpr } from './types';

export enum EvalDataType {
  Closure,
  FEPClosure,
  VMClosure,
  Primitive,
  PrimitiveTransformer,
}

export interface Closure {
  variant: EvalDataType.Closure;
  env: Environment;
  params: string[];
  body: EvalSExpr[];
}

export interface FEPClosure {
  variant: EvalDataType.FEPClosure;
  env: Environment;
  formals: string[];
  rest: string | undefined; // in apply, match as many params as you can. If you run out argument, it's an error,
  // it should be in res
  body: SNonemptyHomList<ExprForm>;
}

export interface VMClosure {
  variant: EvalDataType.VMClosure;
  closureId: number;
  formals: number[];
  rest: number | undefined;
  body: CompiledProgram;
}

export interface Primitive {
  variant: EvalDataType.Primitive;
  fun: (...args: EvalSExpr[]) => EvalResult;
}

export interface PrimitiveTransformer {
  variant: EvalDataType.PrimitiveTransformer;
  fun: (stx: EvalSExpr, env: Environment) => EvalResult;
}

export type EvalData = Closure | FEPClosure | VMClosure | Primitive | PrimitiveTransformer;

export const make_closure = (env: Environment, params: string[], body: EvalSExpr[]): Closure => ({
  variant: EvalDataType.Closure,
  env,
  params,
  body,
});

export const make_fep_closure = (
  env: Environment,
  formals: string[],
  rest: string | undefined,
  body: SNonemptyHomList<ExprForm>
): FEPClosure => ({
  variant: EvalDataType.FEPClosure,
  env,
  formals,
  rest,
  body,
});

export const make_vm_closure = (
  formals: number[],
  closureId: number,
  rest: number | undefined,
  body: number[]
): VMClosure => ({
  variant: EvalDataType.VMClosure,
  closureId,
  formals,
  rest,
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
