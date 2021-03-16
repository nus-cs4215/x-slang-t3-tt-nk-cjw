import { Module } from '../modules';
import { ok, ok_unless_void, Result } from '../utils';

export type CompilerHostErr = string;

// To disambiguate the semantics here
export type ModuleName = string;
export type FileName = string;
export type FileContents = string;

export interface CompilerHost {
  module_name_to_filename(module_name: ModuleName, relative_to?: FileName): FileName;
  read_file(filename: FileName): Result<FileContents, CompilerHostErr>;
  write_file(filename: FileName, contents: FileContents): Result<void, CompilerHostErr>;
  read_builtin_module(module_name: ModuleName): Result<Module, CompilerHostErr>;
}

// Utility to create a compiler host out of a Map
class MapCompilerHost {
  constructor(
    private files: Map<FileName, FileContents>,
    private builtins: Map<ModuleName, Module>
  ) {}

  module_name_to_filename(module_name: ModuleName, relative_to?: FileName) {
    let dirname: string;
    if (relative_to === undefined) {
      dirname = './';
    } else {
      const slashpos = relative_to.lastIndexOf('/');
      if (slashpos === -1) {
        // if filename has no /, then it is relative to .
        dirname = './';
      } else {
        dirname = relative_to.substr(0, slashpos + 1);
      }
    }
    return dirname + module_name + '.rkt';
  }

  read_file(filename: FileName) {
    return ok_unless_void(this.files.get(filename), 'file module not found: ' + filename);
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
  return new MapCompilerHost(files, builtins);
}
