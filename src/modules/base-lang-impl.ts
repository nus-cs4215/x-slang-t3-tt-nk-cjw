import { NonemptyEnvironment } from '../environment';
import { EvalData } from '../evaluator/datatypes';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { match, read_pattern } from '../pattern';
import { print } from '../printer';
import { cdr, scons, SList, ssymbol } from '../sexpr';
import { err, getOk, ok } from '../utils';

function lambda(stx: EvalSExpr, compile_env_: NonemptyEnvironment): EvalResult {
  const match_result = match(stx, getOk(read_pattern("('lambda (stx-params ...) body ...)")));
  if (match_result === undefined) {
    return err('did not match form for lambda: ' + print(stx));
  }
  // Since it looks good, we defer to the core #%plain-lambda transformer
  return ok(scons(ssymbol('#%plain-lambda'), cdr(stx as SList<EvalData>)));
}

export const base_lang_syntaxes: Record<
  string,
  (stx: EvalSExpr, compile_env: NonemptyEnvironment) => EvalResult
> = {
  lambda: lambda,
};
