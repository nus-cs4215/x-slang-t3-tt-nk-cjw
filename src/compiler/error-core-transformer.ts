import { NonemptyEnvironment } from '../environment';
import { FEPNode } from '../fep-types';
import { print } from '../printer';
import { SExpr } from '../sexpr';
import { err, Result } from '../utils';
import {
  CompileErr,
  CompilerFileLocalContext,
  CompilerGlobalContext,
  ExpansionContext,
} from './types';

export function make_error_core_transformer(error: string) {
  function error_core_transformer(
    stx: SExpr,
    expansion_context_: ExpansionContext,
    env_: NonemptyEnvironment,
    global_ctx_: CompilerGlobalContext,
    file_ctx_: CompilerFileLocalContext
  ): Result<FEPNode, CompileErr> {
    return err(error + ': ' + print(stx));
  }
  return error_core_transformer;
}
