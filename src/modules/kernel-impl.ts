import { NonemptyEnvironment } from '../environment';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { cdr, scons, SList, snil, ssymbol } from '../sexpr';
import { ok } from '../utils';

function app(stx: EvalSExpr, compile_env_: NonemptyEnvironment): EvalResult {
  // Just replace #%app with #%plain-app
  return ok(scons(ssymbol('#%plain-app'), cdr(stx as SList<never>)));
}

function datum(stx: EvalSExpr, compile_env_: NonemptyEnvironment): EvalResult {
  // datum should only be called on numbers, booleans, and boxed
  // so we just return it after consing it with quote

  // remove #%datum
  stx = cdr(stx as SList<never>);
  return ok(scons(ssymbol('quote'), scons(stx, snil())));
}

export const kernel_syntaxes: Record<
  string,
  (stx: EvalSExpr, compile_env: NonemptyEnvironment) => EvalResult
> = {
  '#%app': app,
  '#%datum': datum,
};
