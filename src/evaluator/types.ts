import { Environment } from '../environment';
import { ExprOrDefineAst } from '../fep-types';
import { EvaluatorHost, FileName } from '../host';
import { Module } from '../modules';
import { SExprT } from '../sexpr';
import { Result } from '../utils';
import { EvalData } from './datatypes';

export type EvalSExpr = SExprT<EvalData>;

export type EvalErr = string;
export type EvalResult = Result<EvalSExpr, EvalErr>;

export type ApplySyntax = (fun: EvalSExpr, stx: EvalSExpr, env: Environment) => EvalResult;
export type Apply = (fun: EvalSExpr, ...args: EvalSExpr[]) => EvalResult;

export type EvaluateExprOrDefine = (program: ExprOrDefineAst, env: Environment) => EvalResult;

export type EvaluateModule = (
  program: string,
  program_filename: FileName,
  host: EvaluatorHost
) => Result<Module, EvalErr>;
