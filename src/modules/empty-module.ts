import { make_empty_bindings } from '../environment';
import { Module } from './modules';

export const empty_module: Module = {
  name: '#%builtin-empty',
  filename: '',
  provides: make_empty_bindings(),
};
