import { Module, ModuleName, primitives_module } from '../modules';
import { ok_unless_void } from '../utils';
import { ModuleResolver } from './types';

const ts_based_modules_list: Module[] = [primitives_module];
const ts_based_modules: Map<ModuleName, Module> = new Map(
  ts_based_modules_list.map((mod) => [mod.name, mod])
);

export const ts_based_module_resolver: ModuleResolver = {
  resolve(cwd_: string, name: string) {
    return ok_unless_void(ts_based_modules.get(name), 'module not found');
  },
};
