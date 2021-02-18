import { Result } from '../utils';
import { SExpr, SListStruct } from '../sexpr';
import { Environment } from './environment';

export type Closure = void;

export type EvalValue = SListStruct<Closure>;

export type EvalResult = Result<EvalValue, void>;

export type Evaluate = (program: SExpr, env: Environment | undefined) => EvalResult;
