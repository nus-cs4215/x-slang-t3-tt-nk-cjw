import { ModuleFile, ModuleResolver } from './types';

const racket_base_module_contents = ``;
const racket_base_module_file: ModuleFile = {
  name: 'racket/base',
  module_path: undefined,
  contents() {
    return racket_base_module_contents;
  },
};

const racket_modules: ModuleFile[] = [racket_base_module_file];

const racket_modules_map: Map<string, ModuleFile> = new Map(
  racket_modules.map((module_file) => [module_file.name, module_file])
);

export const racket_module_resolver: ModuleResolver = {
  resolve(cwd_: string, name: string) {
    return racket_modules_map.get(name);
  },
};
