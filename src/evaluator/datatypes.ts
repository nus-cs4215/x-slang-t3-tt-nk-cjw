import { EvalValue, EvalResult } from './types';

export enum EvalDataType {
  Primitive,
}

export interface Primitive {
  variant: EvalDataType.Primitive;
  fun: (...args: EvalValue[]) => EvalResult;
}

export type EvalData = Primitive;

export const make_primitive = (fun: (...args: EvalValue[]) => EvalResult): Primitive => ({
  variant: EvalDataType.Primitive,
  fun,
});
