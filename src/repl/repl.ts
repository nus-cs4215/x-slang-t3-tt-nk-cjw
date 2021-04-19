import { compile, compile_entrypoint } from '../compiler';
import { ts_based_modules } from '../compiler/compiler-base';
import { make_initial_compilation_environment } from '../compiler/initial-compilation-environment';
import { CompileErr, ExpansionContext } from '../compiler/types';
import { DefineBinding, get_binding, make_env } from '../environment';
import { evaluate_module } from '../evaluator';
import { EvalErr } from '../evaluator/types';
import { ModuleForm } from '../fep-types';
import { maps_to_compiler_host } from '../host';
import { libs } from '../modules/rkt-modules';
import { print } from '../printer';
import { formatReadErr } from '../reader';
import { read, ReadErr } from '../reader';
import { getOk, isBadResult, ok, Result } from '../utils';
import repl_compiler from './rkt/repl-compiler.rkt';
import { readFile } from 'fs';
import { resolve } from 'path';

type CompileResult = string;
type EvaluateResult = string;

export function compile_and_run_repl(
  program: string
): {
  read?: ReadErr;
  compiled?: Result<CompileResult, CompileErr>;
  evaluated?: Result<EvaluateResult, EvalErr>;
} {
  // INIT VIRTUAL FS
  // 1. Import rkt stdlibs
  // 2. Import built-ins
  // 3. Include our repl's compiler

  // Steps 1 & 2
  const host = maps_to_compiler_host(
    new Map([...libs]), // rkt stdlibs
    ts_based_modules // built-ins
  );

  // Step 3: Include our repl's compiler
  host.write_file('/repl-compiler.rkt', repl_compiler);

  const repl_compiler_fep = getOk(compile_entrypoint('/repl-compiler.rkt', host)) as ModuleForm;

  const repl_compiler_module = getOk(
    evaluate_module(repl_compiler_fep, '/repl-compiler.rkt', host)
  );

  const compile_env = make_env(
    repl_compiler_module.provides,
    make_initial_compilation_environment()
  );

  // COMPILATION

  const filename = '/input.rkt'; // Instantiate a virtual file, in the host. This maps to out input file.
  // const compile_env = make_env(make_empty_bindings(), make_initial_compilation_environment());

  const program_stx_r = read(program); // Text -> Program Syntax
  if (isBadResult(program_stx_r)) {
    return { read: program_stx_r.err };
  }

  // compile (Syntax -> FEP)
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

  // EVALUATE

  const program_result_r = evaluate_module(program_fep_r.v as ModuleForm, filename, host);
  if (isBadResult(program_result_r)) {
    return { compiled: ok(print(program_fep_r.v)), evaluated: program_result_r };
  }
  return {
    compiled: ok(print(program_fep_r.v)),
    evaluated: ok(
      print((get_binding(program_result_r.v.provides, 'repl-result') as DefineBinding).val!)
    ),
  };
}

type Args = {
  isVerbose: boolean; // Verbose prints compilation result
  filePath: string;
};

export function startRepl() {
  const result = parseArgs(process.argv);
  if (result === undefined) {
    return;
  }

  const { isVerbose, filePath } = result;

  readFile(filePath, 'utf8', (err, data) => {
    // Readfile error
    if (err) {
      console.error(err);
      return;
    }

    // Preprocessing
    const processedData = `(repl ${data})`;

    // Parse error
    const result = compile_and_run_repl(processedData);
    if (result['read']) {
      const readError = result['read'];
      console.error(readError);
      console.error(formatReadErr(readError, processedData));
      return;
    }

    if (isVerbose) {
      const compiled = result['compiled'];
      if (compiled && compiled['good']) {
        console.log('COMPILATION RESULT:');
        console.log(compiled['v']);
        console.log('');
      } else {
        console.error('COMPILATION ERROR:');
        console.error(compiled);
        return;
      }
    }

    const evaluated = result['evaluated'];
    if (evaluated && evaluated['good']) {
      console.log('EVALUATION RESULT:');
      console.log(evaluated['v']);
      console.log('');
    } else {
      console.error('EVALUATION ERROR:');
      console.error(evaluated);
    }
  });
}

function parseArgs(args: string[]): Args | undefined {
  // arg[0] == yarn
  // arg[1] == repl
  // arg[2:] actual arguments

  try {
    const arg1 = args[2];
    if (arg1 === '-v' || arg1 === '--verbose') {
      return { isVerbose: true, filePath: resolve(args[3]) };
    }
    return { isVerbose: false, filePath: resolve(process.argv[2]) };
  } catch (_e) {
    console.log('Usage: yarn repl [-v | --verbose] FILEPATH');
    return undefined;
  }
}
