import { Bindings, Environment, make_bindings, make_env_list } from '../environment';
import { make_primitive } from '../evaluator/datatypes';
import { sbox } from '../sexpr';
import { primitive_consts, primitive_funcs } from './primitives-impl';
import { Module } from './types';

const primitive_funcs_bindings: Bindings = make_bindings(
  new Map(Object.entries(primitive_funcs).map(([name, fun]) => [name, sbox(make_primitive(fun))])),
  new Map()
);

const primitive_consts_bindings: Bindings = make_bindings(
  new Map(Object.entries(primitive_consts)),
  new Map()
);

const primitives_env: Environment = make_env_list(
  primitive_funcs_bindings,
  primitive_consts_bindings
);

export const primitives_module: Module = {
  name: '#%builtin-primitives',
  env: primitives_env,
};
