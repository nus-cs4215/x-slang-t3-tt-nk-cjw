import { EvalErr } from '../evaluator/types';
import { TopLevelForm } from '../fep-types';
import { CompilerHost, FileContents, FileName } from '../host';
import { ReadErr } from '../reader';
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
