import { compile_and_run_test } from '../testing/test-runner';
import { readFile } from 'fs';

export function startRepl() {
  const fileName = process.argv[2];
  readFile(fileName, 'utf8', (err, data) => {
    // Readfile error
    if (err) {
      console.error(err);
      return;
    }

    const result = compile_and_run_test(data);
    if (result['read']) {
      console.error(result['read']);
      console.error('error');
      return;
    }

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

    const evaluated = result['evaluated'];
    if (evaluated && evaluated['good']) {
      console.log('EVALUATION RESULT:');
      console.log(evaluated['v']);
      console.log('');
    } else {
      console.error('EVALUATION ERROR:');
      console.error(evaluated);
    }

    // const evaluated = result['evaluated'];
    // if (evaluated && evaluated.good) {
    //   console.log('EVALUATION RESULT:');
    //   console.log(evaluated['v']);
    //   console.log('');
    // }
  });
}
