import { expand_in_expression_context } from '../compiler';
import { CompileErr } from '../compiler/types';
import { make_bindings, make_env, NonemptyEnvironment } from '../environment';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { FEExpr } from '../fep-types';
import { json_star, json_var, match } from '../pattern';
import { is_symbol, jsonRead, SExpr, slist, snil, ssymbol, val } from '../sexpr';
import { cases, err, isBadResult, map_results, ok, Result } from '../utils';

const lambda_pattern = jsonRead([
  'lambda',
  json_star(json_var('params'), []),
  '.',
  json_star(json_var('body'), []),
]);
function lambda(stx: EvalSExpr, compile_env: NonemptyEnvironment): EvalResult {
  const match_result = match(stx, lambda_pattern);
  if (match_result === undefined) {
    return err();
  }
  const { params: params_, body: body_ } = match_result;
  const params = params_ === undefined ? [] : params_;
  const body = body_ === undefined ? [] : body_;
  // Verify formals are in correct format
  if (!params.every(is_symbol)) {
    return err();
  }
  // Extend compile_env with new symbols
  const new_compile_env = make_env(
    make_bindings(new Map(params.map((p) => [val(p), undefined])), new Map()),
    compile_env
  );
  // expand body in expression context
  const expanded_body_result: Result<FEExpr[], CompileErr> = map_results(
    (e) => expand_in_expression_context(e as SExpr, new_compile_env),
    body
  );
  if (isBadResult(expanded_body_result)) {
    return err();
  }
  return ok(
    slist([ssymbol('#%plain-lambda'), slist(params, snil()), ...expanded_body_result.v], snil())
  );
}

function expression(stx: EvalSExpr, compile_env: NonemptyEnvironment): EvalResult {
  return cases(
    expand_in_expression_context(stx as SExpr, compile_env),
    (good) => ok(good) as EvalResult,
    (bad_) => err() as EvalResult
  );
}

export const base_lang_syntaxes: Record<
  string,
  (stx: EvalSExpr, compile_env: NonemptyEnvironment) => EvalResult
> = {
  lambda: lambda,
  '#%expression': expression,
};
