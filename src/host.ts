import { evaluate_module } from './evaluator';
import { ModuleAst } from './fep-types';
import { Module } from './modules';
import { read } from './reader';
import { err, isBadResult, ok, ok_unless_void, Result } from './utils';

export type HostErr = string;

// To disambiguate the semantics here
export type ModuleName = string;
export type FileName = string;
export type FileContents = string;

export interface EvaluatorHost {
  read_fep_module(module_name: ModuleName, relative_to?: FileName): Result<Module, HostErr>;
  read_builtin_module(module_name: ModuleName): Result<Module, HostErr>;
}

export interface CompilerHost extends EvaluatorHost {
  module_name_to_filename(module_name: ModuleName, relative_to?: FileName): FileName;
  read_file(filename: FileName): Result<FileContents, HostErr>;
  write_file(filename: FileName, contents: FileContents): Result<void, HostErr>;
  read_builtin_module(module_name: ModuleName): Result<Module, HostErr>;
}

function normalize_path(path: string) {
  path = path
    .replace(/.*\/\//g, '/') // double slashes indicate absolute paths: /blah/blah//absolute/path -> /absolute/path
    .replace(/\/\.\//g, '/'); // /./ -> /
  let prev_path = undefined;
  while (path !== prev_path) {
    // replace one occurrence of ../ at a time just in case
    prev_path = path;
    path = path.replace(/\/[^/]*\/\.\.\//, '/'); // /something/../ -> /
  }
  return path;
}

// Utility to create a compiler host out of a Map
class MapHost {
  constructor(
    private files: Map<FileName, FileContents>,
    private builtins: Map<ModuleName, Module>,
    private loaded: Map<FileName, Module> = new Map()
  ) {}

  module_name_to_filename(module_name: ModuleName, relative_to: FileName) {
    let dirname: string;
    const slashpos = relative_to.lastIndexOf('/');
    if (slashpos === -1) {
      // if filename has no /, then it is an error
      throw 'paths have gone very wrong';
    } else {
      dirname = relative_to.substr(0, slashpos + 1);
    }
    return normalize_path(dirname + module_name + '.rkt');
  }

  read_file(filename: FileName) {
    return ok_unless_void(this.files.get(filename), 'file module not found: ' + filename);
  }

  read_fep_module(module_name: ModuleName, relative_to: FileName): Result<Module, string> {
    const fep_filename = this.module_name_to_filename(module_name, relative_to) + '.fep';
    if (this.loaded.has(fep_filename)) {
      return ok(this.loaded.get(fep_filename)!);
    }

    const fep_contents_r = this.read_file(fep_filename);
    if (isBadResult(fep_contents_r)) {
      return fep_contents_r;
    }
    const fep_r = read(fep_contents_r.v);
    if (isBadResult(fep_r)) {
      return err('error when reading precompiled fep: ' + fep_r.err);
    }
    const fep_module_r = evaluate_module(fep_r.v as ModuleAst, fep_filename, this);
    if (isBadResult(fep_module_r)) {
      return err('error when evaluating precompiled fep: ' + fep_module_r.err);
    }
    this.loaded.set(fep_filename, fep_module_r.v);
    return fep_module_r;
  }

  read_builtin_module(module_name: ModuleName) {
    return ok_unless_void(
      this.builtins.get(module_name),
      'builtin module not found: ' + module_name
    );
  }

  write_file(filename: FileName, contents: FileContents) {
    this.files.set(filename, contents);
    return ok(undefined);
  }
}

export function maps_to_compiler_host(
  files: Map<FileName, FileContents>,
  builtins: Map<ModuleName, Module>
): CompilerHost {
  return new MapHost(files, builtins);
}

export function maps_to_evaluator_host(
  files: Map<FileName, FileContents>,
  builtins: Map<ModuleName, Module>
): EvaluatorHost {
  return new MapHost(files, builtins);
}
