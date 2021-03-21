import { Bindings, install_bindings, make_empty_bindings, set_syntax } from '../environment';
import { make_primitive_transformer } from '../evaluator/datatypes';
import { sbox } from '../sexpr';
import { core_module } from './core-module';
import { kernel_syntaxes } from './kernel-impl';
import { Module } from './modules';
import { primitives_module } from './primitives-module';

const kernel_bindings: Bindings = make_empty_bindings();

install_bindings(kernel_bindings, primitives_module.provides);
install_bindings(kernel_bindings, core_module.provides);

Object.entries(kernel_syntaxes).forEach(([name, transformer]) =>
  set_syntax(kernel_bindings, name, sbox(make_primitive_transformer(transformer)))
);

export const kernel_module: Module = {
  name: '#%builtin-kernel',
  filename: '',
  provides: kernel_bindings,
};
