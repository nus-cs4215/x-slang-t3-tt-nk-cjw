import { Bindings, make_bindings } from '../environment';
import { make_primitive } from '../evaluator/datatypes';
import { sbox } from '../sexpr';
import { primitive_consts, primitive_funcs } from './primitives-impl';
import { Module } from './types';

const primitive_bindings: Bindings = make_bindings(
  new Map([
    ...Object.entries(primitive_consts),
    ...Object.entries(primitive_funcs).map(
      ([name, fun]) => [name, sbox(make_primitive(fun))] as const
    ),
  ]),
  new Map()
);

export const primitives_module: Module = {
  name: '#%builtin-primitives',
  provides: primitive_bindings,
};
