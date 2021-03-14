import { EvalErr } from '../evaluator/types';
import { TopLevelForm } from '../fep-types';
import { Module } from '../modules';
import { ReadErr } from '../reader';
import { Result } from '../utils';

export type CompilerHostErr = string;

export type ModuleName = string;
export type FileName = string;
export type FileContents = string;

// To disambiguate the semantics here
export interface CompilerHost {
  module_name_to_filename(module_name: ModuleName, relative_to?: FileName): FileName;
  read_file(filename: FileName): Result<FileContents, CompilerHostErr>;
  write_file(filename: FileName, contents: FileContents): Result<void, CompilerHostErr>;
  read_builtin_module(module_name: ModuleName): Result<Module, CompilerHostErr>;
}

export type CompileErr = string | ReadErr | EvalErr;
export interface CompileModuleResultV {
  fep: TopLevelForm;
  compiled_filenames: Map<FileName, FileName>;
}
export type CompileModule = (
  module_contents: string,
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
