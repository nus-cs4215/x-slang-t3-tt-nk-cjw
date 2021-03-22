import { print } from '../printer';
import { getOk } from '../utils';
import { readExprCompileEvaluateOutput } from '../utils/compile-and-eval';

function expectReadEvalPrint(program: string) {
  return expect(print(getOk(readExprCompileEvaluateOutput(program))));
}

test.skip('plus one', () => {
  expectReadEvalPrint(`
    (define output__
      (let ([plus1 (#%plain-lambda (x) (+ x 1))])
        (plus1 1)))
    `).toMatchInlineSnapshot(`"2"`);
});

test('thrice thrice', () => {
  expectReadEvalPrint(`
    (begin
      (define thrice
        (#%plain-lambda (f)
          (#%plain-lambda (x) (f (f (f x))))))
      (define output___
        (((thrice thrice) add1) 0)))
    `).toMatchInlineSnapshot(`"27"`);
});

test('fibonacci', () => {
  expectReadEvalPrint(`
    (begin
      (define fib
        (#%plain-lambda (n)
          (if (<= n 1)
              n
              (+ (fib (- n 1))
                 (fib (- n 2))))))
      (define output___
        (fib 7)))
    `).toMatchInlineSnapshot(`"13"`);
});

test.skip("newton's method sqrt", () => {
  expectReadEvalPrint(`
    (begin
      (define tolerance 0.000000000000001)
      (define close-enough
        (#%plain-lambda (x y)
          (< (abs (- x y)) tolerance)))
      (define fixed-point
        (#%plain-lambda (f first-guess)
          (define try-with
            (#%plain-lambda (guess)
              (define next (f guess))
              (if (close-enough guess next)
                  next
                  (try-with next))))
          (try-with first-guess)))
      (define average
        (#%plain-lambda (x y) (/ (+ x y) 2)))
      (define sqrt
        (#%plain-lambda (x)
          (fixed-point
            (lambda (y)
              (average y (/ x y)))
            1)))
      (define output___
        (list (sqrt 5)                 ; square root of 5
              (* (sqrt 5) (sqrt 5))))) ; square of square root of 5
    `).toMatchInlineSnapshot(`"(2.23606797749979 5.000000000000001)"`);
});
