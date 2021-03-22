import { Environment } from '../environment';
import { EvalErr } from '../evaluator/types';
import { FEPNode, TopLevelForm } from '../fep-types';
import { CompilerHost, FileContents, FileName } from '../host';
import { ReadErr } from '../reader';
import { SExpr } from '../sexpr';
import { Result } from '../utils';

export type CompileErr = string | ReadErr | EvalErr;
export interface CompileModuleResultV {
  fep: TopLevelForm;
  compiled_filenames: Map<FileName, FileName>;
}
export type CompileModule = (
  module_filename: FileName,
  module_contents: FileContents,
  host: CompilerHost
) => Result<CompileModuleResultV, CompileErr>;

// output filename for the FEP of the compiled module
export interface CompileResultV {
  compiled_filenames: Map<FileName, FileName>;
}
export type Compile = (
  host: CompilerHost,
  filename: FileName
) => Result<CompileResultV, CompileErr>;

export enum ExpansionContext {
  TopLevelContext,
  ModuleBeginContext,
  ModuleContext,
  InternalDefinitionContext,
  ExpressionContext,
}

export interface CompilerGlobalContext {
  host: CompilerHost;
  compiled_filenames: Map<FileName, FileName>;

  expansion_depth: number;
  MAX_MACRO_EXPANSION_DEPTH_LIMIT: number;
}

export interface CompilerFileLocalContext {
  filename: FileName;
}

export type CompileV2 = (
  stx: SExpr,
  expansion_context: ExpansionContext,
  env: Environment,
  global_ctx: CompilerGlobalContext,
  file_ctx: CompilerFileLocalContext
) => Result<FEPNode, CompileErr>;
