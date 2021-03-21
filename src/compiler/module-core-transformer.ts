import {
  Environment,
  find_env,
  install_bindings,
  make_empty_bindings,
  make_env,
  NonemptyEnvironment,
  set_define,
  set_syntax,
} from '../environment';
import { evaluate_general_top_level, evaluate_module } from '../evaluator';
import {
  FEExpr,
  FEPNode,
  ModuleBuiltinParentForm,
  ModuleFileParentForm,
  TopLevelModuleFormAst,
} from '../fep-types';
import { ModuleName } from '../host';
import { get_module_info, Module } from '../modules';
import {
  extract_matches,
  json_symvar,
  json_var,
  match,
  MatchObject,
  read_pattern,
} from '../pattern';
import { print } from '../printer';
import {
  car,
  cdr,
  is_list,
  is_nil,
  is_symbol,
  jsonRead,
  scons,
  SExpr,
  SHomList,
  SList,
  slist,
  snil,
  SSymbol,
  ssymbol,
  val,
} from '../sexpr';
import { err, getOk, isBadResult, ok, Result, then } from '../utils';
import { compile_file, compile, partial_expand } from './compiler';
import {
  CompileErr,
  CompilerFileLocalContext,
  CompilerGlobalContext,
  ExpansionContext,
} from './types';

export function module_core_transformer(
  stx: SExpr,
  expansion_context: ExpansionContext,
  env: NonemptyEnvironment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<FEPNode, CompileErr> {
  if (expansion_context !== ExpansionContext.TopLevelContext) {
    return err('module only allowed in top level contexts. (submodules not supported)');
  }

  const module_info_r = get_module_info(stx);
  if (isBadResult(module_info_r)) {
    return module_info_r;
  }
  const module_info = module_info_r.v;

  const { name: module_name, module_path_is_builtin, module_path_name } = module_info;
  const module_begin = cdr(cdr(cdr(stx as any))) as SHomList<SExpr>;

  let parent_module: Module;
  if (module_path_is_builtin) {
    const parent_module_r = global_ctx.host.read_builtin_module(module_path_name);
    if (isBadResult(parent_module_r)) {
      return parent_module_r;
    }
    parent_module = parent_module_r.v;
  } else {
    const parent_module_r = compile_and_run(module_path_name, global_ctx, file_ctx);
    if (isBadResult(parent_module_r)) {
      return parent_module_r;
    }
    parent_module = parent_module_r.v;
  }

  // Install parent module
  env = make_env(parent_module.provides, env);

  // Module environment
  env = make_env(make_empty_bindings(), env);

  // Now expand the module begin form to a module body

  const module_body_r = expand_to_plain_module_begin(module_begin, env);

  if (isBadResult(module_body_r)) {
    return module_body_r;
  }
  let module_body = cdr(module_body_r.v as SList<never>);

  const module_body_stack: SExpr[] = [];
  const partially_expanded_stmts: SExpr[] = [];
  {
    const forms: SExpr[] = [];
    while (is_list(module_body)) {
      forms.push(car(module_body));
      module_body = cdr(module_body);
    }
    for (let i = forms.length - 1; i >= 0; i--) {
      module_body_stack.push(forms[i]);
    }
  }
  if (!is_nil(module_body)) {
    return err('non-nil tail in module body');
  }

  const provide_names: Set<string> = new Set();

  // First pass, partially expand everything until everything is at the statement level.
  // While we're doing this, we process bindings and syntaxes,
  // but we DON'T expand RHSes or expressions until a second pass.
  while (module_body_stack.length > 0) {
    //// Each form is partially expanded (see Partial Expansion) in a module
    //// context. Further action depends on the shape of the form:
    const form = module_body_stack.pop()!;
    const new_form_r = partial_expand(form, env);
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
            //// If it is a begin form, the sub-forms are flattened out into the
            //// module’s body and immediately processed in place of the begin.

            const match_result = match(new_form, getOk(read_pattern("('begin statements ...)")));
            if (match_result === undefined) {
              return err('did not match pattern for begin: ' + print(new_form));
            }
            extract_matches(match_result, (statements: SExpr[]) => {
              for (let i = statements.length - 1; i >= 0; i--) {
                module_body_stack.push(statements[i]);
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
            set_define(env.bindings, varname, undefined);

            partially_expanded_stmts.push(
              slist([ssymbol('define'), ssymbol(varname), rhs], snil())
            );
            break;
          }
          case 'define-syntax': {
            //// If it is a define-syntaxes form, then the right-hand side is
            //// evaluated (in phase 1), and the binding is immediately installed
            //// for further partial expansion within the module. Evaluation of
            //// the right-hand side is parameterized to set current-namespace as
            //// in let-syntax.

            // compile rhs
            const name_and_compiled_rhs_r = compile_define_syntax_rhs_or_error(
              new_form,
              env,
              global_ctx,
              file_ctx
            );
            if (isBadResult(name_and_compiled_rhs_r)) {
              return name_and_compiled_rhs_r;
            }
            const [name, compiled_rhs] = name_and_compiled_rhs_r.v;

            // evaluate rhs
            const rhs_r = evaluate_general_top_level(compiled_rhs, env);
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
            set_syntax(env.bindings, name, rhs);

            partially_expanded_stmts.push(
              slist([ssymbol('define-syntax'), ssymbol(name), compiled_rhs], snil())
            );
            break;
          }
          case '#%require': {
            //// If the form is a #%require form, bindings are introduced
            //// immediately, and the imported modules are instantiated or
            //// visited as appropriate.

            const module_r = evaluate_require_module(new_form, global_ctx, file_ctx);
            if (isBadResult(module_r)) {
              return module_r;
            }
            install_bindings(env.bindings, module_r.v.provides);

            partially_expanded_stmts.push(new_form);
            break;
          }
          case '#%provide': {
            //// If the form is a #%provide form, then it is recorded for
            //// processing after the rest of the body.
            let names = cdr(new_form);
            while (is_list(names)) {
              const name = car(names);
              if (!is_symbol(name)) {
                return err('fancy provides not implemented yet, use only symbols in #%provide');
              }
              provide_names.add(val(name));
              names = cdr(names);
            }
            if (!is_nil(names)) {
              return err('non-nil in tail position of #%provide');
            }

            partially_expanded_stmts.push(new_form);
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
  const module_body_fep: FEPNode[] = [];
  for (const stmt of partially_expanded_stmts) {
    if (!is_list(stmt)) {
      const fep_r = compile(stmt, ExpansionContext.ExpressionContext, env, global_ctx, file_ctx);
      if (isBadResult(fep_r)) {
        return fep_r;
      }
      module_body_fep.push(fep_r.v);
      continue;
    }
    const head = car(stmt);
    if (!is_symbol(head)) {
      const fep_r = compile(stmt, ExpansionContext.ExpressionContext, env, global_ctx, file_ctx);
      if (isBadResult(fep_r)) {
        return fep_r;
      }
      module_body_fep.push(fep_r.v);
      continue;
    }
    const command = val(head);
    switch (command) {
      case 'define-syntax':
      case '#%require':
      case '#%provide': {
        // No-ops since they were already expanded / can't be expanded
        module_body_fep.push(stmt as FEPNode);
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
          env,
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
        module_body_fep.push(define_fep);
        break;
      }
      default: {
        const fep_r = compile(stmt, ExpansionContext.ExpressionContext, env, global_ctx, file_ctx);
        if (isBadResult(fep_r)) {
          return fep_r;
        }
        module_body_fep.push(fep_r.v);
        break;
      }
    }
  }
  // end of second pass

  // all we need to do now is concat everything and emit
  if (module_path_is_builtin) {
    return ok(
      slist(
        [
          ssymbol('module'),
          ssymbol(module_name),
          slist([ssymbol('quote'), ssymbol(module_path_name)] as const, snil()),
          slist([ssymbol('#%plain-module-begin'), ...module_body_fep], snil()),
        ] as const,
        snil()
      ) as ModuleBuiltinParentForm
    );
  } else {
    return ok(
      slist(
        [
          ssymbol('module'),
          ssymbol(module_name),
          ssymbol(module_path_name),
          slist([ssymbol('#%plain-module-begin'), ...module_body_fep], snil()),
        ] as const,
        snil()
      ) as ModuleFileParentForm
    );
  }
}

function expand_to_plain_module_begin(
  module_begin: SExpr,
  env: Environment
): Result<SExpr, CompileErr> {
  //// From Racket docs:
  //// https://docs.racket-lang.org/reference/module.html#%28form._%28%28quote._~23~25kernel%29._module%29%29

  // If a single form is provided, then it is partially expanded in a
  // module-begin context.
  if (is_list(module_begin) && is_nil(cdr(module_begin))) {
    const expanded_module_begin_r = partial_expand(car(module_begin), env);
    if (isBadResult(expanded_module_begin_r)) {
      return expanded_module_begin_r;
    }
    //// If the expansion leads to #%plain-module-begin, then the
    //// body of the #%plain-module-begin is the body of the module.
    const expanded_module_begin = expanded_module_begin_r.v;
    if (is_list(expanded_module_begin)) {
      const head = car(expanded_module_begin);
      if (is_symbol(head) && val(head) === '#%plain-module-begin') {
        //// If the expansion leads to #%plain-module-begin, then the body of the
        //// #%plain-module-begin is the body of the module.
        return ok(expanded_module_begin);
      }

      // If partial expansion leads to any other primitive form, then the form
      // is wrapped with #%module-begin using the lexical context of the module
      // body;
      module_begin = slist([ssymbol('#%module-begin'), expanded_module_begin], snil());
    } else {
      // If partial expansion leads to any other primitive form, then the form
      // is wrapped with #%module-begin using the lexical context of the module
      // body;
      module_begin = slist([ssymbol('#%module-begin'), expanded_module_begin], snil());
    }
  } else {
    //// Finally, if multiple forms are provided, they are wrapped with
    //// #%module-begin, as in the case where a single form does not expand to
    //// #%plain-module-begin.
    module_begin = scons(ssymbol('#%module-begin'), module_begin);
  }

  //// this identifier must be bound by the initial module-path import, and its
  //// expansion must produce a #%plain-module-begin to supply the module body.
  if (find_env('#%module-begin', env) === undefined) {
    return err('#%module-begin not bound in ' + print(module_begin));
  }
  const should_be_plain_module_begin_r = partial_expand(module_begin, env);
  if (isBadResult(should_be_plain_module_begin_r)) {
    return should_be_plain_module_begin_r;
  }
  const should_be_plain_module_begin = should_be_plain_module_begin_r.v;
  if (!is_list(should_be_plain_module_begin)) {
    return err(
      "#%module-begin expanded to something that wasn't a #%plain-module-begin " +
        print(should_be_plain_module_begin)
    );
  }
  const head = car(should_be_plain_module_begin);
  if (!is_symbol(head) || val(head) !== '#%plain-module-begin') {
    return err(
      "#%module-begin expanded to something that wasn't a #%plain-module-begin " +
        print(should_be_plain_module_begin)
    );
  }

  return ok(should_be_plain_module_begin);
}

const define_syntax_pattern = jsonRead(['define-syntax', json_symvar('name'), json_var('value')]);
export function compile_define_syntax_rhs_or_error(
  stx: SExpr,
  env: Environment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<[string, FEExpr], CompileErr> {
  const match_result = match(stx, define_syntax_pattern);
  if (match_result !== undefined) {
    const {
      name: [name_expr],
      value: [value_expr],
    } = match_result as MatchObject<never> & { name: [SSymbol] };
    return then(
      compile(value_expr, ExpansionContext.ExpressionContext, env, global_ctx, file_ctx),
      (fep) => ok([val(name_expr), fep as FEExpr])
    );
  } else {
    return err('did not match form for define-syntax: ' + print(stx));
  }
}

const define_pattern = jsonRead(['define', json_symvar('name'), json_var('value')]);
export function get_define_varname_and_rhs(stx: SExpr): Result<[string, SExpr], CompileErr> {
  const match_result = match(stx, define_pattern);
  if (match_result !== undefined) {
    const {
      name: [name_expr],
      value: [value_expr],
    } = match_result as MatchObject<never> & { name: [SSymbol] };
    return ok([val(name_expr), value_expr]);
  } else {
    return err('did not match form for define: ' + print(stx));
  }
}

const require_file_pattern = jsonRead(['#%require', json_symvar('name')]);
const require_builtin_pattern = jsonRead(['#%require', ['quote', json_symvar('name')]]);
function evaluate_require_module(
  stx: SExpr,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<Module, CompileErr> {
  {
    const match_result = match(stx, require_file_pattern);
    if (match_result !== undefined) {
      return extract_matches(match_result, (name: [SSymbol]) => {
        const module_name = val(name[0]);
        // compile required module
        return compile_and_run(module_name, global_ctx, file_ctx);
      });
    }
  }
  {
    const match_result = match(stx, require_builtin_pattern);
    if (match_result !== undefined) {
      return extract_matches(match_result, (name: [SSymbol]) => {
        const module_name = val(name[0]);
        const module_r = global_ctx.host.read_builtin_module(module_name);
        if (isBadResult(module_r)) {
          return err(`error requiring module ${module_name}: ${module_r.err}`);
        }
        return module_r;
      });
    }
  }
  return err('did not match format for require ' + print(stx));
}

function compile_and_run(
  module_name: ModuleName,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<Module, CompileErr> {
  const required_filename = global_ctx.host.module_name_to_filename(module_name, file_ctx.filename);

  const compile_r = compile_file(required_filename, global_ctx);
  if (isBadResult(compile_r)) {
    return compile_r;
  }
  const fep = compile_r.v;
  // evaluate it
  const module_r = evaluate_module(
    fep as TopLevelModuleFormAst,
    required_filename,
    global_ctx.host
  );

  if (isBadResult(module_r)) {
    return err(`error requiring module ${module_name}: ${module_r.err}`);
  }
  return module_r;
}
