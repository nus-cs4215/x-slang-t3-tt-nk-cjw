import { Result } from '../utils';
import { SExprT } from '../sexpr';
import { Environment } from '../environment';
import { EvalData } from './datatypes';
import { GeneralTopLevelFormAst, TopLevelForm } from '../fep-types';

export type EvalSExpr = SExprT<EvalData>;

export type EvalErr = void;
export type EvalResult = Result<EvalSExpr, EvalErr>;

export type ApplySyntax = (fun: EvalSExpr, stx: EvalSExpr, env: Environment) => EvalResult;
export type Apply = (fun: EvalSExpr, ...args: EvalSExpr[]) => EvalResult;

export type Evaluate = (program: EvalSExpr, env: Environment) => EvalResult;

export type EvaluateTopLevel = (program: TopLevelForm, env: Environment) => EvalResult;
export type EvaluateGeneralTopLevel = (
  program: GeneralTopLevelFormAst,
  env: Environment
) => EvalResult;
