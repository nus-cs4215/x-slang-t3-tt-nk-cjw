import { Environment, NonemptyEnvironment } from '../environment';
import { TopLevelForm } from '../fep-types';
import { SExpr } from '../sexpr';
import { Result } from '../utils';

export type ModuleName = string;

// A module is basically an environment we can evaluate in
export interface Module {
  name: ModuleName;
  context: NonemptyEnvironment;
}

export interface ModuleFile {
  name: ModuleName;
  // Contrary to its name,
  // module_path is more like the parent module's name
  // rather than the location of the module...
  // This is also why I'm letting it be undefined;
  // the base module should have no parents.
  module_path: ModuleName | undefined;
  contents(): string;
}

export interface ModuleResolver {
  resolve(cwd: string, name: string): ModuleFile | undefined;
}

export type CompileError = string;
export type CompileResult = Result<TopLevelForm, CompileError>;
export type Compile = (program: SExpr, env: Environment) => CompileResult;
