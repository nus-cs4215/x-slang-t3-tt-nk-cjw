import { Bindings, make_bindings } from '../environment';
import { make_primitive_transformer } from '../evaluator/datatypes';
import { sbox } from '../sexpr';
import { kernel_syntaxes } from './kernel-impl';
import { Module } from './types';

const kernel_bindings: Bindings = make_bindings(
  new Map(),
  new Map(
    Object.entries(kernel_syntaxes).map(([name, transformer]) => [
      name,
      sbox(make_primitive_transformer(transformer)),
    ])
  )
);

export const kernel_module: Module = {
  name: '#%builtin-kernel',
  provides: kernel_bindings,
};
