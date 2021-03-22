import { compile_entrypoint } from '../compiler';
import { ts_based_modules } from '../compiler/compiler-base';
import { CompileErr } from '../compiler/types';
import { DefineBinding } from '../environment';
import { maps_to_compiler_host } from '../host';
import { print } from '../printer';
import { SExpr, SExprT } from '../sexpr';
import { isBadResult, ok, Result } from './result';

export function readExprCompileEvaluate(expression: string): Result<SExprT<unknown>, CompileErr> {
  const module_contents = `(module input '#%builtin-kernel (define output___ ${expression}) (#%provide output___))`;
  const host = maps_to_compiler_host(new Map([['/input.rkt', module_contents]]), ts_based_modules);
  const compile_result = compile_entrypoint('/input.rkt', host);
  if (isBadResult(compile_result)) {
    return compile_result;
  }
  const module_result = host.read_fep_module('input', '/input.rkt');
  if (isBadResult(module_result)) {
    return module_result;
  }
  return ok((module_result.v.provides.get('output___')! as DefineBinding).val!);
}

export function readExprCompileEvaluateOutput(
  expression: string
): Result<SExprT<unknown>, CompileErr> {
  const module_contents = `(module input '#%builtin-kernel ${expression} (#%provide output___))`;
  const host = maps_to_compiler_host(new Map([['/input.rkt', module_contents]]), ts_based_modules);
  const compile_result = compile_entrypoint('/input.rkt', host);
  if (isBadResult(compile_result)) {
    return compile_result;
  }
  const module_result = host.read_fep_module('input', '/input.rkt');
  if (isBadResult(module_result)) {
    return module_result;
  }
  return ok((module_result.v.provides.get('output___')! as DefineBinding).val!);
}

export function exprCompileEvaluate(expression: SExpr): Result<SExprT<unknown>, CompileErr> {
  const module_contents = `(module input '#%builtin-kernel (define output___ ${print(
    expression
  )}) (#%provide output___))`;
  const host = maps_to_compiler_host(new Map([['/input.rkt', module_contents]]), ts_based_modules);
  const compile_result = compile_entrypoint('/input.rkt', host);
  if (isBadResult(compile_result)) {
    return compile_result;
  }
  const module_result = host.read_fep_module('input', '/input.rkt');
  if (isBadResult(module_result)) {
    return module_result;
  }
  return ok((module_result.v.provides.get('output___')! as DefineBinding).val!);
}
