import { EvalErr } from '../evaluator/types';
import { TopLevelForm } from '../fep-types';
import { Module, ModuleName } from '../modules';
import { ReadErr } from '../reader';
import { Result } from '../utils';

export interface ModuleFile {
  name: ModuleName;
  contents(): string;
}

export type ModuleResolutionErr = string | ReadErr | CompileErr;

export interface ModuleResolver {
  resolveFileModule(cwd: string, name: string): Result<Module, ModuleResolutionErr>;
  resolveBuiltinModule(name: string): Result<Module, ModuleResolutionErr>;
}

export type CompileErr = string | ReadErr | EvalErr;
export type CompileResult = Result<TopLevelForm, CompileErr>;
export type CompileModule = (module_contents: string) => CompileResult;
