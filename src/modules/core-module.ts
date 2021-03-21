import { Bindings, make_empty_bindings, set_core } from '../environment';
import { core_transformers } from './core-impl';
import { Module } from './modules';

const core_bindings: Bindings = make_empty_bindings();

Object.entries(core_transformers).forEach(([name, core_trans]) =>
  set_core(core_bindings, name, core_trans)
);

export const core_module: Module = {
  name: '#%builtin-core',
  filename: '',
  provides: core_bindings,
};
