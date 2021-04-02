import { compile, compile_entrypoint } from '../compiler';
import { builtin_compiler_host } from '../compiler/compiler-base';
import { make_initial_compilation_environment } from '../compiler/initial-compilation-environment';
import { CompileErr, ExpansionContext } from '../compiler/types';
import { DefineBinding, get_binding, make_env } from '../environment';
import { evaluate_module } from '../evaluator';
import { EvalErr } from '../evaluator/types';
import { ModuleForm } from '../fep-types';
import { print } from '../printer';
import { read, ReadErr } from '../reader';
import { SExprT } from '../sexpr';
import { getOk, isBadResult, ok, Result } from '../utils';
import test_compiler from './rkt/test-compiler.rkt';

type CompileResult = string;
type EvaluateResult = string;
export function compile_and_run_test(
  program: string
): {
  read?: ReadErr;
  compiled?: Result<CompileResult, CompileErr>;
  evaluated?: Result<EvaluateResult, EvalErr>;
} {
  // Put our fancy lib in
  const host = builtin_compiler_host();
  host.write_file('/testing/test-compiler.rkt', test_compiler);
  // Compile the compiler
  const test_compiler_fep = getOk(
    compile_entrypoint('/testing/test-compiler.rkt', host)
  ) as ModuleForm;
  const test_compiler_module = getOk(
    evaluate_module(print(test_compiler_fep), '/testing/test-compiler.rkt', host)
  );

  const compile_env = make_env(
    test_compiler_module.provides,
    make_initial_compilation_environment()
  );

  // Now we RCEP (read, compile, evaluate, and print) our user program

  const filename = '/test.rkt';

  // read
  const program_stx_r = read(program);
  if (isBadResult(program_stx_r)) {
    return { read: program_stx_r.err };
  }

  // compile
  const program_fep_r = compile(
    program_stx_r.v,
    ExpansionContext.TopLevelContext,
    compile_env,
    {
      host,
      compiled_filenames: new Map(),
      expansion_depth: 0,
      MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
    },
    { filename }
  );
  if (isBadResult(program_fep_r)) {
    return { compiled: program_fep_r };
  }

  // evaluate
  const program_result_r = evaluate_module(print(program_fep_r.v), filename, host);
  if (isBadResult(program_result_r)) {
    return { compiled: ok(print(program_fep_r.v)), evaluated: program_result_r };
  }
  return {
    compiled: ok(print(program_fep_r.v)),
    evaluated: ok(
      print((get_binding(program_result_r.v.provides, 'test-result') as DefineBinding).val!)
    ),
  };
}

type EvaluateWithoutPrintResult = SExprT<unknown>;
export function compile_and_run_test_without_print(
  program: string
): Result<
  { compiled: CompileResult; evaluated: EvaluateWithoutPrintResult },
  ReadErr | CompileErr | EvalErr
> {
  // Put our fancy lib in
  const host = builtin_compiler_host();
  host.write_file('/testing/test-compiler.rkt', test_compiler);
  // Compile the compiler
  const test_compiler_fep = getOk(
    compile_entrypoint('/testing/test-compiler.rkt', host)
  ) as ModuleForm;
  const test_compiler_module = getOk(
    evaluate_module(print(test_compiler_fep), '/testing/test-compiler.rkt', host)
  );

  const compile_env = make_env(
    test_compiler_module.provides,
    make_initial_compilation_environment()
  );

  // Now we RCEP (read, compile, evaluate, and print) our user program

  const filename = '/test.rkt';

  // read
  const program_stx_r = read(program);
  if (isBadResult(program_stx_r)) {
    return program_stx_r;
  }

  // compile
  const program_fep_r = compile(
    program_stx_r.v,
    ExpansionContext.TopLevelContext,
    compile_env,
    {
      host,
      compiled_filenames: new Map(),
      expansion_depth: 0,
      MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
    },
    { filename }
  );
  if (isBadResult(program_fep_r)) {
    return program_fep_r;
  }

  // evaluate
  const program_result_r = evaluate_module(print(program_fep_r.v), filename, host);
  if (isBadResult(program_result_r)) {
    return program_result_r;
  }
  return ok({
    compiled: print(program_fep_r.v),
    evaluated: (get_binding(program_result_r.v.provides, 'test-result') as DefineBinding).val!,
  });
}
