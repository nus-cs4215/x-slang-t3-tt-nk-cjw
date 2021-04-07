import { formatReadErr } from '../reader';
import { compile_and_run_test } from '../testing/test-runner';
import { readFile } from 'fs';
import { resolve } from 'path';

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
    const processedData = `(test ${data})`;

    // Parse error
    const result = compile_and_run_test(processedData);
    if (result['read']) {
      const readError = result['read'];
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
