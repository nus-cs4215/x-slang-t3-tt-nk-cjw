import { CompilerHost, maps_to_compiler_host, ModuleName } from '../host';
import { empty_module, Module, primitives_module } from '../modules';
import { base_lang_module } from '../modules/base-lang-module';
import { kernel_module } from '../modules/kernel-module';

const ts_based_modules_list: Module[] = [
  primitives_module,
  empty_module,
  kernel_module,
  base_lang_module,
];
export const ts_based_modules: Map<ModuleName, Module> = new Map(
  ts_based_modules_list.map((mod) => [mod.name, mod])
);

const ts_based_compiler_host = maps_to_compiler_host(new Map(), ts_based_modules);

export const builtin_compiler_host: CompilerHost = ts_based_compiler_host;
