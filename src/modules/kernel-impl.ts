import { find_env, NonemptyEnvironment } from '../environment';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { print } from '../printer';
import { cdr, scons, SList, snil, ssymbol } from '../sexpr';
import { err, ok } from '../utils';

function module_begin(stx: EvalSExpr, compile_env_: NonemptyEnvironment): EvalResult {
  // Just replace #%module-begin with #%plain-module-begin
  return ok(scons(ssymbol('#%plain-module-begin'), cdr(stx as SList<never>)));
}

function app(stx: EvalSExpr, compile_env: NonemptyEnvironment): EvalResult {
  // Just replace #%app with #%plain-app
  if (find_env('#%plain-app', compile_env) === undefined) {
    return err('#%plain-app not bound in ' + print(stx));
  }
  return ok(scons(ssymbol('#%plain-app'), cdr(stx as SList<never>)));
}

function datum(stx: EvalSExpr, compile_env: NonemptyEnvironment): EvalResult {
  // datum should only be called on numbers, booleans, and boxed
  // so we just return it after consing it with quote

  if (find_env('quote', compile_env) === undefined) {
    return err('quote not bound in ' + print(stx));
  }
  // remove #%datum
  stx = cdr(stx as SList<never>);
  return ok(scons(ssymbol('quote'), scons(stx, snil())));
}

function top_(stx: EvalSExpr, compile_env: NonemptyEnvironment): EvalResult {
  // Just replace (#%top . x) with (#%variable-reference x)

  if (find_env('#%variable-reference', compile_env) === undefined) {
    return err('#%variable-reference not bound in ' + print(stx));
  }
  stx = cdr(stx as SList<never>);
  return ok(scons(ssymbol('#%variable-reference'), scons(stx, snil())));
}

export const kernel_syntaxes: Record<
  string,
  (stx: EvalSExpr, compile_env: NonemptyEnvironment) => EvalResult
> = {
  '#%module-begin': module_begin,
  '#%app': app,
  '#%datum': datum,
  '#%top': top_,
};
