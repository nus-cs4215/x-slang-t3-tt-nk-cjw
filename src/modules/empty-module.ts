import { make_empty_bindings, make_env_list } from '../environment';
import { Module } from './types';

export const empty_module: Module = {
  name: '#%builtin-empty',
  env: make_env_list(make_empty_bindings()),
};
