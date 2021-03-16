import { evaluate } from '../evaluator';
import { primitives_module } from '../modules';
import { print } from '../printer';
import { read } from '../reader';
import { getOk } from '../utils';

const the_global_environment = primitives_module.env;

function expectReadEvalPrint(program: string) {
  return expect(print(getOk(evaluate(getOk(read(program)), the_global_environment))));
}

test('plus one', () => {
  expectReadEvalPrint('(let ([plus1 (lambda (x) (+ x 1))]) (plus1 1))').toMatchInlineSnapshot(
    `"2"`
  );
});

test('thrice thrice', () => {
  expectReadEvalPrint(`
    (begin
      (define (thrice f)
        (lambda (x) (f (f (f x)))))
      (((thrice thrice) add1) 0))
    `).toMatchInlineSnapshot(`"27"`);
});

test('fibonacci', () => {
  expectReadEvalPrint(`
    (begin
      (define (fib n)
         (cond [(<= n 1) n]
               [true (+ (fib (- n 1))
                        (fib (- n 2)))]))
      (fib 7))
    `).toMatchInlineSnapshot(`"13"`);
});

test("newton's method sqrt", () => {
  expectReadEvalPrint(`
    (begin
      (define tolerance 0.000000000000001)
      (define (close-enough x y)
        (< (abs (- x y)) tolerance))
      (define (fixed-point f first-guess)
        (define (try-with guess)
          (define next (f guess))
          (cond [(close-enough guess next) next]
                [#t (try-with next)]))
        (try-with first-guess))
      (define (average x y) (/ (+ x y) 2))
      (define (sqrt x)
        (fixed-point
          (lambda (y)
            (average y (/ x y)))
          1))
      (list (sqrt 5)                ; square root of 5
            (* (sqrt 5) (sqrt 5)))) ; square of square root of 5
    `).toMatchInlineSnapshot(`"(2.23606797749979 5.000000000000001)"`);
});
