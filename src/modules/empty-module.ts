import { make_empty_bindings } from '../environment';
import { Module } from './types';

export const empty_module: Module = {
  name: '#%builtin-empty',
  provides: make_empty_bindings(),
};
