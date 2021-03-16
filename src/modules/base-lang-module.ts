import { Bindings, make_bindings } from '../environment';
import { make_primitive_transformer } from '../evaluator/datatypes';
import { sbox } from '../sexpr';
import { base_lang_syntaxes } from './base-lang-impl';
import { Module } from './types';

const base_lang_bindings: Bindings = make_bindings(
  new Map(),
  new Map(
    Object.entries(base_lang_syntaxes).map(([name, transformer]) => [
      name,
      sbox(make_primitive_transformer(transformer)),
    ])
  )
);

export const base_lang_module: Module = {
  name: '#%builtin-base-lang',
  provides: base_lang_bindings,
};
