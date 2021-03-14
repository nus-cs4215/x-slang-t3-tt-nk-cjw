import { empty_module, Module, ModuleName, primitives_module } from '../modules';
import { base_lang_module } from '../modules/base-lang-module';
import { kernel_module } from '../modules/kernel-module';
import { err, ok_unless_void } from '../utils';
import { ModuleResolver } from './types';

const ts_based_modules_list: Module[] = [
  primitives_module,
  empty_module,
  kernel_module,
  base_lang_module,
];
const ts_based_modules: Map<ModuleName, Module> = new Map(
  ts_based_modules_list.map((mod) => [mod.name, mod])
);

const ts_based_module_resolver: ModuleResolver = {
  resolveFileModule(cwd_: string, name_: string) {
    return err('module not found');
  },
  resolveBuiltinModule(name: string) {
    return ok_unless_void(ts_based_modules.get(name), 'module not found');
  },
};

export const builtin_module_resolver: ModuleResolver = ts_based_module_resolver;
