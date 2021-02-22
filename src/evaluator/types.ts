import { Result } from '../utils';
import { SExprT } from '../sexpr';
import { Environment } from './environment';
import { EvalData } from './datatypes';

export type EvalSExpr = SExprT<EvalData>;

export type EvalResult = Result<EvalSExpr, void>;

export type Apply = (fun: EvalSExpr, ...args: EvalSExpr[]) => EvalResult;

export type Evaluate = (program: EvalSExpr, env: Environment) => EvalResult;
