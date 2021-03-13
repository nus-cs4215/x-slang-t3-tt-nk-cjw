import { TopLevelForm } from '../fep-types';
import { Module, ModuleName } from '../modules';
import { read, ReadErr, ReadResult } from '../reader';
import { Result } from '../utils';

export interface ModuleFile {
  name: ModuleName;
  contents(): string;
}

// Convenience methods on module_file
export function read_module_file(f: ModuleFile): ReadResult {
  return read(f.contents());
}

export type ModuleResolutionErr = string | ReadErr | CompileErr;

export interface ModuleResolver {
  resolveFileModule(cwd: string, name: string): Result<Module, ModuleResolutionErr>;
  resolveBuiltinModule(name: string): Result<Module, ModuleResolutionErr>;
}

export type CompileErr = string;
export type CompileResult = Result<TopLevelForm, CompileErr | ReadErr>;
export type CompileModule = (module_file: ModuleFile) => CompileResult;
