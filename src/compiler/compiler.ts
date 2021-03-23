import { BindingType, Environment, lookup_binding } from '../environment';
import { apply_syntax } from '../evaluator';
import { EvalData } from '../evaluator/datatypes';
import { FEPNode } from '../fep-types';
import { CompilerHost, FileName } from '../host';
import { print } from '../printer';
import { read } from '../reader';
import {
  car,
  is_list,
  is_symbol,
  scons,
  SExpr,
  SExprT,
  snil,
  ssymbol,
  STypes,
  val,
} from '../sexpr';
import { err, isBadResult, isGoodResult, ok, Result, then } from '../utils';
import { make_initial_compilation_environment } from './initial-compilation-environment';
import {
  CompileErr,
  CompilerFileLocalContext,
  CompilerGlobalContext,
  ExpansionContext,
} from './types';

export type SExprExpansion = { _type: 'SExpr'; v: SExpr };
export type FEPNodeExpansion = { _type: 'FEPNode'; v: FEPNode };
export type Expansion = SExprExpansion | FEPNodeExpansion;

export const sexpr_expansion = (v: SExpr): SExprExpansion => ({ _type: 'SExpr', v });
export const fep_expansion = (v: FEPNode): FEPNodeExpansion => ({ _type: 'FEPNode', v });

// Partial expand basically only expands user macros
// does NOT add #%app, #%top, and #%datum.
export function partial_expand(stx: SExpr, env: Environment): Result<SExpr, CompileErr> {
  // Refer to expand_once to see how this works

  // manual TCO
  for (;;) {
    // If stx is number, boolean, or nil, immediately handle
    switch (stx._type) {
      case STypes.Number:
      case STypes.Boolean: {
        // Data
        return ok(stx);
      }
      case STypes.Nil: {
        // Empty application
        return ok(stx);
      }
    }

    // stx is list or symbol
    // Extract identifier in head position
    let identifier_name: string;
    if (is_symbol(stx)) {
      identifier_name = val(stx);
    } else {
      // stx is list
      const head = car(stx);
      if (is_symbol(head)) {
        identifier_name = val(head);
      } else {
        // list with non-symbol head
        return ok(stx);
      }
    }

    // now that we have identifier, look it up in env
    const identifier_binding = lookup_binding(identifier_name, env);
    if (identifier_binding === undefined) {
      // Unbound identifier
      // Add top unless it is one of the three we must not casually keep continuing
      if (identifier_name === '#%app') {
        return err('#%app not bound in ' + print(stx));
      }
      if (identifier_name === '#%top') {
        return err('#%top not bound in ' + print(stx));
      }
      if (identifier_name === '#%datum') {
        return err('#%datum not bound in ' + print(stx));
      }

      if (is_list(stx)) {
        return ok(stx);
      } else {
        return ok(stx);
      }
    }

    // identifier was bound, decide what to do depending on type of binding
    switch (identifier_binding._type) {
      case BindingType.Define:
      case BindingType.Core: {
        return ok(stx);
      }

      case BindingType.Syntax: {
        const stx_transformer = identifier_binding.val;
        const expansion_r = apply_syntax(stx_transformer as SExprT<EvalData>, stx, env);
        if (isBadResult(expansion_r)) {
          return err(
            'partial_expand_v2: error when partially expanding application of stx transformer ' +
              print(stx) +
              ': ' +
              expansion_r.err
          );
        }
        stx = expansion_r.v as SExpr;
        continue;
      }
    }
  }
}

export function expand_once(
  stx: SExpr,
  expansion_context: ExpansionContext,
  env: Environment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<Expansion, CompileErr> {
  //// From Racket docs:
  //// https://docs.racket-lang.org/reference/syntax-model.html#%28part._expansion%29

  // Alternatively, consult "docs/Compiler Flowchart"

  // The summary is as follows:
  // We first extract whatever is at the head position:
  //     (head rest ...) -> head
  //     head -> head
  // If head was a macro we need to perform macro expansion.
  //
  // If head is not a symbol, it can't possibly be a macro,
  // so we either handle it like a function application (add #%app)
  // or a literal (add #%datum)
  // or a variable reference (add #%top if unbound, #%variable-reference if bound)
  //
  // Now if head WAS a symbol, there's a chance head is a macro
  // We check this by looking it up in the environment
  // and do different things depending on whether it was bound to a syntax transformer or not.
  // If it was bound to just a variable, we handle it as if head was not a symbol, see above.
  // If it was bound to a syntax transformer, we apply it and return the result.
  // If it was bound to a core transformer, we apply it and return the result.

  // If stx is number, boolean, or nil, immediately handle
  switch (stx._type) {
    case STypes.Number:
    case STypes.Boolean: {
      // Data
      return ok(sexpr_expansion(scons(ssymbol('#%datum'), stx)));
    }
    case STypes.Nil: {
      // Empty application
      return ok(sexpr_expansion(scons(ssymbol('#%app'), stx)));
    }
  }

  // stx is list or symbol
  // Extract identifier in head position
  let identifier_name: string;
  if (is_symbol(stx)) {
    identifier_name = val(stx);
  } else {
    // stx is list
    const head = car(stx);
    if (is_symbol(head)) {
      identifier_name = val(head);
    } else {
      // list with non-symbol head
      return ok(sexpr_expansion(scons(ssymbol('#%app'), stx)));
    }
  }

  // now that we have identifier, look it up in env
  const identifier_binding = lookup_binding(identifier_name, env);
  if (identifier_binding === undefined) {
    // Unbound identifier
    // Add top unless it is one of the three we must not casually keep continuing
    if (identifier_name === '#%app') {
      return err('#%app not bound in ' + print(stx));
    }
    if (identifier_name === '#%top') {
      return err('#%top not bound in ' + print(stx));
    }
    if (identifier_name === '#%datum') {
      return err('#%datum not bound in ' + print(stx));
    }

    if (is_list(stx)) {
      return ok(sexpr_expansion(scons(ssymbol('#%app'), stx)));
    } else {
      return ok(sexpr_expansion(scons(ssymbol('#%top'), stx)));
    }
  }

  // identifier was bound, decide what to do depending on type of binding

  switch (identifier_binding._type) {
    case BindingType.Define: {
      if (is_symbol(stx)) {
        // We don't support references to arbitarry bindings...
        // So we'll just output the FEP for it.
        // The compile environment *does* in fact
        // correctly correspond to the lexical scope,
        // so there's no issue here.
        return ok(fep_expansion(scons(ssymbol('#%variable-reference'), scons(stx, snil()))));
      }

      // stx is alr guaranteed to be list here
      return ok(sexpr_expansion(scons(ssymbol('#%app'), stx)));
    }

    case BindingType.Syntax: {
      // For us, we bake the stx transformer as a js function of one argument
      // No checking required (here).
      const stx_transformer = identifier_binding.val;
      const expansion_r = apply_syntax(stx_transformer as SExprT<EvalData>, stx, env);
      if (isBadResult(expansion_r)) {
        return err(
          'expand_once_v2: error when expanding application of stx transformer ' +
            print(stx) +
            ': ' +
            expansion_r.err
        );
      }
      return ok(sexpr_expansion(expansion_r.v as SExpr));

      // Never happens, no checking required (here).
    }

    case BindingType.Core: {
      return then(
        identifier_binding.fun(stx, expansion_context, env, global_ctx, file_ctx),
        (fep) => ok(fep_expansion(fep))
      );
    }
  }
}

export function compile(
  stx: SExpr,
  expansion_context: ExpansionContext,
  env: Environment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
): Result<FEPNode, CompileErr> {
  const prev_expansion_depth = global_ctx.expansion_depth;
  for (
    ;
    global_ctx.expansion_depth < global_ctx.MAX_MACRO_EXPANSION_DEPTH_LIMIT;
    global_ctx.expansion_depth++
  ) {
    // Keep expanding until we hit FEP
    const expansion_r = expand_once(stx, expansion_context, env, global_ctx, file_ctx);
    if (isBadResult(expansion_r)) {
      global_ctx.expansion_depth = prev_expansion_depth;
      return expansion_r;
    }
    const expansion = expansion_r.v;
    if (expansion._type === 'FEPNode') {
      global_ctx.expansion_depth = prev_expansion_depth;
      return ok(expansion.v);
    } else {
      stx = expansion.v;
    }
  }
  global_ctx.expansion_depth = prev_expansion_depth;
  return err(
    'Too much recursion at macro expansion! Please increase the max macro expansion depth limit. Were you trying to write compile time theorem proving or something?'
  );
}

export function compile_file(
  filename: FileName,
  global_ctx: CompilerGlobalContext
): Result<FEPNode, CompileErr> {
  const fep_filename = filename + '.fep';
  const fep_module_contents_r = global_ctx.host.read_file(fep_filename);
  if (isGoodResult(fep_module_contents_r)) {
    const fep_read_r = read(fep_module_contents_r.v);
    if (isBadResult(fep_read_r)) {
      return err('corrupt fep file ' + fep_filename);
    }
    return ok(fep_read_r.v as FEPNode);
  }
  const module_contents_r = global_ctx.host.read_file(filename);
  if (isBadResult(module_contents_r)) {
    return module_contents_r;
  }
  const module_stx_r = read(module_contents_r.v);
  if (isBadResult(module_stx_r)) {
    return module_stx_r;
  }
  const module_r = compile(
    module_stx_r.v,
    ExpansionContext.TopLevelContext,
    make_initial_compilation_environment(),
    global_ctx,
    { filename }
  );
  if (isBadResult(module_r)) {
    return module_r;
  }
  const module_fep_str = print(module_r.v);
  global_ctx.host.write_file(fep_filename, module_fep_str);
  global_ctx.compiled_filenames.set(filename, fep_filename);
  return module_r;
}

export function compile_entrypoint(
  filename: FileName,
  host: CompilerHost
): Result<FEPNode, CompileErr> {
  return compile_file(filename, {
    host,
    compiled_filenames: new Map(),
    expansion_depth: 0,
    MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
  });
}
