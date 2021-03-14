import { Bindings, Environment, make_bindings, make_env_list } from '../environment';
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

const kernel_env: Environment = make_env_list(kernel_bindings);

export const kernel_module: Module = {
  name: '#%builtin-kernel',
  env: kernel_env,
};
