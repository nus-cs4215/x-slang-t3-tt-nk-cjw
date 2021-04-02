import { print } from '../printer';
import { getOk } from '../utils';
import { readExprCompileEvaluateOutput } from '../utils/compile-and-eval';

function expectReadEvalPrint(program: string) {
  return expect(print(getOk(readExprCompileEvaluateOutput(program))));
}

test('macro loop benchmark', () => {
  expectReadEvalPrint(`
    (begin
      (define-syntax foo
        (#%plain-lambda (stx)
          (define i (car (cdr stx)))
          (if (< i 50000)
            (cons 'foo (cons (+ i 1) '()))
            ''done)))
      (define output___
        (foo 0))
      )
    `).toMatchInlineSnapshot(`"done"`);
});
