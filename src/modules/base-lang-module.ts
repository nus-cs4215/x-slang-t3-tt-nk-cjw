import { Bindings, install_bindings, make_bindings, make_empty_bindings } from '../environment';
import { make_primitive_transformer } from '../evaluator/datatypes';
import { sbox } from '../sexpr';
import { base_lang_syntaxes } from './base-lang-impl';
import { kernel_module } from './kernel-module';
import { Module } from './modules';

const base_lang_bindings: Bindings = make_empty_bindings();

install_bindings(base_lang_bindings, kernel_module.provides);

install_bindings(
  base_lang_bindings,
  make_bindings(
    new Map(),
    new Map(
      Object.entries(base_lang_syntaxes).map(([name, transformer]) => [
        name,
        sbox(make_primitive_transformer(transformer)),
      ])
    )
  )
);

export const base_lang_module: Module = {
  name: '#%builtin-base-lang',
  filename: '',
  provides: base_lang_bindings,
};
