import { compile, partial_expand } from '../compiler';
import { make_error_core_transformer } from '../compiler/error-core-transformer';
import {
  compile_define_syntax_rhs_or_error,
  get_define_varname_and_rhs,
} from '../compiler/module-core-transformer';
import {
  CompileErr,
  CompilerFileLocalContext,
  CompilerGlobalContext,
  ExpansionContext,
} from '../compiler/types';
import {
  Environment,
  make_empty_bindings,
  make_env,
  NonemptyEnvironment,
  set_define,
  set_syntax,
} from '../environment';
import { evaluate_general_top_level } from '../evaluator';
import { FEPNode, PlainAppForm, PlainLambdaForm } from '../fep-types';
import { extract_matches, match, read_pattern } from '../pattern';
import { print } from '../printer';
import { car, is_list, is_symbol, SExpr, slist, snil, SSymbol, ssymbol, val } from '../sexpr';
import { err, getOk, isBadResult, map_results, ok, Result, then } from '../utils';

function self_compiling_in_expression_context(
  name: string,
  pattern_string: string
): (
  stx: SExpr,
  expansion_context: ExpansionContext,
  env_: NonemptyEnvironment,
  global_ctx_: CompilerGlobalContext,
  file_ctx_: CompilerFileLocalContext
) => Result<FEPNode, CompileErr> {
  const pattern = getOk(read_pattern(pattern_string));
  return (
    stx: SExpr,
    expansion_context: ExpansionContext,
    env_: NonemptyEnvironment,
    global_ctx_: CompilerGlobalContext,
    file_ctx_: CompilerFileLocalContext
  ): Result<FEPNode, CompileErr> => {
    if (expansion_context !== ExpansionContext.ExpressionContext) {
      return err(
        'this ' +
          name +
          ' core transformer only applies in an expression context. perhaps you meant to use a different language?'
      );
    }
    const match_result = match(stx, pattern);
    if (match_result === undefined) {
      return err('did not match pattern for ' + name + ': ' + print(stx));
    }

    return ok(stx as FEPNode);
  };
}

function plain_app(
  stx: SExpr,
  expansion_context: ExpansionContext,
  env: NonemptyEnvironment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<FEPNode, CompileErr> {
  if (expansion_context !== ExpansionContext.ExpressionContext) {
    return err(
      'this #%plain-app core transformer only applies in an expression context. perhaps you meant to use a different language?'
    );
  }
  const match_result = match(stx, getOk(read_pattern("('#%plain-app f xs ...)")));
  if (match_result === undefined) {
    return err('did not match pattern for #%plain-app: ' + print(stx));
  }

  // recursively compile all the parts in expression context
  return extract_matches(match_result, (f: [SExpr], xs: SExpr[]) =>
    then(compile(f[0], ExpansionContext.ExpressionContext, env, global_ctx, file_ctx), (f_fep) =>
      then(
        map_results(
          (x) => compile(x, ExpansionContext.ExpressionContext, env, global_ctx, file_ctx),
          xs
        ),
        (x_feps) =>
          ok(slist([ssymbol('#%plain-app'), f_fep, ...x_feps] as const, snil()) as PlainAppForm)
      )
    )
  );
}

function plain_lambda(
  stx: SExpr,
  expansion_context: ExpansionContext,
  env: NonemptyEnvironment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<PlainLambdaForm, CompileErr> {
  if (expansion_context !== ExpansionContext.ExpressionContext) {
    return err(
      'this #%plain-lambda core transformer only applies in an expression context. perhaps you meant to use a different language?'
    );
  }
  const match_result = match(
    stx,
    getOk(read_pattern("('#%plain-lambda (sym-params ...) body ...)"))
  );
  if (match_result === undefined) {
    return err('did not match pattern for #%plain-lambda: ' + print(stx));
  }

  // recursively compile all the parts in expression context
  return extract_matches(
    match_result,
    (params: SSymbol[], body: SExpr[]): Result<PlainLambdaForm, CompileErr> => {
      // First we make a new environment with the params all set to undefined
      const lambda_env = make_env(make_empty_bindings(), env);
      params.forEach((s) => set_define(lambda_env.bindings, val(s), undefined));

      const body_stack: SExpr[] = [];
      for (let i = body.length - 1; i >= 0; i--) {
        body_stack.push(body[i]);
      }
      const partially_expanded_stmts: SExpr[] = [];

      // First pass, partially expand everything until everything is at the statement level.
      // While we're doing this, we process bindings and syntaxes,
      // but we DON'T expand RHSes or expressions until a second pass.
      while (body_stack.length > 0) {
        const form = body_stack.pop()!;
        const new_form_r = partial_expand(form, lambda_env);
        if (isBadResult(new_form_r)) {
          return new_form_r;
        }
        const new_form = new_form_r.v;
        if (!is_list(new_form)) {
          //// Similarly, if the form is an expression, it is not expanded further.
          partially_expanded_stmts.push(new_form);
        } else {
          const head = car(new_form);
          if (!is_symbol(head)) {
            //// Similarly, if the form is an expression, it is not expanded further.
            partially_expanded_stmts.push(new_form);
          } else {
            const command = val(head);
            switch (command) {
              case 'begin': {
                // Splice the shit in
                const match_result = match(
                  new_form,
                  getOk(read_pattern("('begin statements ...)"))
                );
                if (match_result === undefined) {
                  return err('did not match pattern for begin: ' + print(new_form));
                }
                extract_matches(match_result, (statements: SExpr[]) => {
                  for (let i = statements.length - 1; i >= 0; i--) {
                    body_stack.push(statements[i]);
                  }
                });
                continue;
              }
              case 'define': {
                //// If the form is a define-values form, then the binding is
                //// installed immediately, but the right-hand expression is not
                //// expanded further.

                const varname_and_rhs_r = get_define_varname_and_rhs(new_form);
                if (isBadResult(varname_and_rhs_r)) {
                  return varname_and_rhs_r;
                }
                const [varname, rhs] = varname_and_rhs_r.v;
                set_define(lambda_env.bindings, varname, undefined);

                partially_expanded_stmts.push(
                  slist([ssymbol('define'), ssymbol(varname), rhs], snil())
                );
                break;
              }
              case 'define-syntax': {
                // compile rhs
                const name_and_compiled_rhs_r = compile_define_syntax_rhs_or_error(
                  new_form,
                  lambda_env,
                  global_ctx,
                  file_ctx
                );
                if (isBadResult(name_and_compiled_rhs_r)) {
                  return name_and_compiled_rhs_r;
                }
                const [name, compiled_rhs] = name_and_compiled_rhs_r.v;

                // evaluate rhs
                const rhs_r = evaluate_general_top_level(compiled_rhs, lambda_env);
                if (isBadResult(rhs_r)) {
                  return err(
                    'error when evaluating rhs of define-syntax in ' +
                      print(new_form) +
                      ': ' +
                      rhs_r.err
                  );
                }
                const rhs = rhs_r.v;

                // install binding
                set_syntax(lambda_env.bindings, name, rhs);

                partially_expanded_stmts.push(
                  slist([ssymbol('define-syntax'), ssymbol(name), compiled_rhs], snil())
                );
                break;
              }
              default: {
                //// Similarly, if the form is an expression, it is not expanded further.

                partially_expanded_stmts.push(new_form);
                break;
              }
            }
          }
        }
      }
      // end of first pass

      // Now we expand RHSes and expressions
      const body_fep: FEPNode[] = [];
      for (const stmt of partially_expanded_stmts) {
        if (!is_list(stmt)) {
          const fep_r = compile(
            stmt,
            ExpansionContext.ExpressionContext,
            lambda_env,
            global_ctx,
            file_ctx
          );
          if (isBadResult(fep_r)) {
            return fep_r;
          }
          body_fep.push(fep_r.v);
          continue;
        }
        const head = car(stmt);
        if (!is_symbol(head)) {
          const fep_r = compile(
            stmt,
            ExpansionContext.ExpressionContext,
            lambda_env,
            global_ctx,
            file_ctx
          );
          if (isBadResult(fep_r)) {
            return fep_r;
          }
          body_fep.push(fep_r.v);
          continue;
        }
        const command = val(head);
        switch (command) {
          case 'define-syntax': {
            // No-ops since they were already expanded / can't be expanded
            body_fep.push(stmt as FEPNode);
            continue;
          }
          case 'define': {
            const varname_and_rhs_r = get_define_varname_and_rhs(stmt);
            if (isBadResult(varname_and_rhs_r)) {
              return varname_and_rhs_r;
            }
            const [varname, rhs] = varname_and_rhs_r.v;

            const fep_rhs_r = compile(
              rhs,
              ExpansionContext.ExpressionContext,
              lambda_env,
              global_ctx,
              file_ctx
            );
            if (isBadResult(fep_rhs_r)) {
              return fep_rhs_r;
            }
            const define_fep = slist(
              [ssymbol('define'), ssymbol(varname), fep_rhs_r.v],
              snil()
            ) as FEPNode;
            body_fep.push(define_fep);
            break;
          }
          default: {
            const fep_r = compile(
              stmt,
              ExpansionContext.ExpressionContext,
              lambda_env,
              global_ctx,
              file_ctx
            );
            if (isBadResult(fep_r)) {
              return fep_r;
            }
            body_fep.push(fep_r.v);
            break;
          }
        }
      }
      // end of second pass

      // all we need to do now is concat everything and emit
      return ok(
        slist(
          [ssymbol('#%plain-lambda'), slist([...params] as const, snil())] as const,
          slist([...body_fep] as const, snil())
        ) as PlainLambdaForm
      );
    }
  );
}

export const core_transformers: Record<
  string,
  (
    stx: SExpr,
    expansion_context: ExpansionContext,
    env: Environment,
    global_ctx: CompilerGlobalContext,
    file_ctx: CompilerFileLocalContext
  ) => Result<FEPNode, CompileErr>
> = {
  begin: make_error_core_transformer(
    'begin forms only allowed in certain core syntactic forms (e.g. directly inside a module)'
  ),
  '#%require': make_error_core_transformer(
    '#%require forms only allowed in certain core syntactic forms (e.g. directly inside a module)'
  ),
  '#%provide': make_error_core_transformer(
    '#%provide forms only allowed in certain core syntactic forms (e.g. directly inside a module)'
  ),
  define: make_error_core_transformer(
    'define forms only allowed in certain core syntactic forms (e.g. directly inside a module)'
  ),
  'define-syntax': make_error_core_transformer(
    'define-syntax forms only allowed in certain core syntactic forms (e.g. directly inside a module)'
  ),
  quote: self_compiling_in_expression_context('quote', "('quote datum)"),
  '#%variable-reference': self_compiling_in_expression_context(
    '#%variable-reference',
    "('#%variable-reference sym-x)"
  ),
  '#%plain-app': plain_app,
  '#%plain-lambda': plain_lambda,
};
