import { Environment } from '../environment';
import { TopLevelForm } from '../fep-types';
import { Module } from '../modules';
import { SExprT } from '../sexpr';
import { Result } from '../utils';
import { EvalData } from './datatypes';

export type EvalSExpr = SExprT<EvalData>;

export type EvalErr = void;
export type EvalResult = Result<EvalSExpr, EvalErr>;

export type ApplySyntax = (fun: EvalSExpr, stx: EvalSExpr, env: Environment) => EvalResult;
export type Apply = (fun: EvalSExpr, ...args: EvalSExpr[]) => EvalResult;

export type Evaluate = (program: EvalSExpr, env: Environment) => EvalResult;

export type EvaluateModule = (program: TopLevelForm) => Result<Module, EvalErr>;
