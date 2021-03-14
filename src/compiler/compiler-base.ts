import { empty_module, Module, primitives_module } from '../modules';
import { base_lang_module } from '../modules/base-lang-module';
import { kernel_module } from '../modules/kernel-module';
import { err, ok, ok_unless_void } from '../utils';
import { CompilerHost, FileContents, FileName, ModuleName } from './types';

const ts_based_modules_list: Module[] = [
  primitives_module,
  empty_module,
  kernel_module,
  base_lang_module,
];
const ts_based_modules: Map<ModuleName, Module> = new Map(
  ts_based_modules_list.map((mod) => [mod.name, mod])
);

const ts_based_module_resolver: CompilerHost = {
  module_name_to_filename(module_name: ModuleName, relative_to_?: FileName) {
    return module_name;
  },
  read_file(filename_: FileName) {
    return err('module not found');
  },
  read_builtin_module(module_name: ModuleName) {
    return ok_unless_void(ts_based_modules.get(module_name), 'module not found');
  },
  write_file(filename_: FileName, contents_: FileContents) {
    return ok(undefined);
  },
};

export const builtin_module_resolver: CompilerHost = ts_based_module_resolver;
