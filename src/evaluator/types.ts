import { Result } from '../utils';
import { SListStruct } from '../sexpr';
import { Environment } from './environment';
import { EvalData } from './datatypes';

export type EvalValue = SListStruct<EvalData>;

export type EvalResult = Result<EvalValue, void>;

export type Apply = (fun: EvalValue, ...args: EvalValue[]) => EvalResult;

export type Evaluate = (program: EvalValue, env: Environment) => EvalResult;
