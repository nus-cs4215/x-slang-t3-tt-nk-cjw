import { compile_and_run_test } from '../test-runner';

describe('test compiler works properly', () => {
  test('cond', () => {
    expect(
      compile_and_run_test(`
      (test-lib /libs/racket/private/cond
        (cond)
        )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/cond) (#%provide test-result) (define test-result (quote no_match))))",
          "evaluated": "no_match",
        },
      }
    `);

    expect(
      compile_and_run_test(`
      (test-lib /libs/racket/private/cond
        (cond [#t 1 2 3])
        )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/cond) (#%provide test-result) (define test-result (if (quote #t) (begin (quote 1) (quote 2) (quote 3)) (quote no_match)))))",
          "evaluated": "3",
        },
      }
    `);

    expect(
      compile_and_run_test(`
      (test-lib /libs/racket/private/cond
        (cond [(null? '()) 1])
        )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/cond) (#%provide test-result) (define test-result (if (#%plain-app (#%variable-reference null?) (quote ())) (begin (quote 1)) (quote no_match)))))",
          "evaluated": "1",
        },
      }
    `);

    expect(
      compile_and_run_test(`
      (test-lib /libs/racket/private/cond
        (cond [(null? '()) 1]
              [#t 3])
        )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/cond) (#%provide test-result) (define test-result (if (#%plain-app (#%variable-reference null?) (quote ())) (begin (quote 1)) (if (quote #t) (begin (quote 3)) (quote no_match))))))",
          "evaluated": "1",
        },
      }
    `);

    expect(
      compile_and_run_test(`
      (test-lib /libs/racket/private/cond
        (cond [#f 1 2 3]
              [#f 4 5 6])
        )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/cond) (#%provide test-result) (define test-result (if (quote #f) (begin (quote 1) (quote 2) (quote 3)) (if (quote #f) (begin (quote 4) (quote 5) (quote 6)) (quote no_match))))))",
          "evaluated": "no_match",
        },
      }
    `);
  });
  test('when test program compiles and evaluates fine', () => {
    expect(
      compile_and_run_test(`
        (test
          (define y 2)
          (let* ([x 3]
                 [y x])
            (+ x y))
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/base) (#%provide test-result) (define y (quote 2)) (define test-result (let ((x (quote 3))) (let ((y (#%variable-reference x))) (begin (#%plain-app (#%variable-reference +) (#%variable-reference x) (#%variable-reference y))))))))",
          "evaluated": "6",
        },
      }
    `);

    expect(
      compile_and_run_test(`
        (test-lib /libs/racket/private/let
          (define y 2)
          (let* ([x 3]
                 [y x])
            (+ x y))
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/let) (#%provide test-result) (define y (quote 2)) (define test-result (let ((x (quote 3))) (let ((y (#%variable-reference x))) (begin (#%plain-app (#%variable-reference +) (#%variable-reference x) (#%variable-reference y))))))))",
          "evaluated": "6",
        },
      }
    `);

    expect(
      compile_and_run_test(`
        (test-lib (rename '#%builtin-kernel + fancy-+)
          (fancy-+ 1 2)
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require (rename (quote #%builtin-kernel) + fancy-+)) (#%provide test-result) (define test-result (#%plain-app (#%variable-reference fancy-+) (quote 1) (quote 2)))))",
          "evaluated": "3",
        },
      }
    `);

    expect(
      compile_and_run_test(`
        (test-libs (/libs/racket/private/quasiquote /libs/racket/private/let)
          (define y 2)
          (let* ([x 3]
                 [y x])
            ~(+ ,x ,y))
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "compiled": "(module test-module (quote #%builtin-kernel) (#%plain-module-begin (#%require /libs/racket/private/quasiquote /libs/racket/private/let) (#%provide test-result) (define y (quote 2)) (define test-result (let ((x (quote 3))) (let ((y (#%variable-reference x))) (begin (#%plain-app (#%variable-reference cons) (quote +) (#%plain-app (#%variable-reference cons) (#%variable-reference x) (#%plain-app (#%variable-reference cons) (#%variable-reference y) (quote ()))))))))))",
          "evaluated": "(+ 3 3)",
        },
      }
    `);
  });

  test('shows error if test program forgot to require the right thing', () => {
    expect(
      compile_and_run_test(`
        (test-lib /libs/racket/private/quasiquote
          (let* ([x 3]
                 [y x])
            (+ x y))
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": "evaluate (#%variable-reference): could not find variable let*",
        "good": false,
        "v": undefined,
      }
    `);
  });

  test('shows error if test program has some invalid syntax', () => {
    expect(
      compile_and_run_test(`
        (test
          (let* ([x 3]
                 [y x])
            (+ x y))
          ; forgot to close module
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": Object {
          "loc": Object {
            "end": Object {
              "character": 124,
              "column": 6,
              "line": 7,
            },
            "start": Object {
              "character": 124,
              "column": 6,
              "line": 7,
            },
          },
          "message": "Unexpected EOF",
        },
        "good": false,
        "v": undefined,
      }
    `);
  });

  test('shows error if test program failed during compilation', () => {
    expect(
      compile_and_run_test(`
        (test
          (let* [x 3] ; incorrect format for let*
                [y x]
            (+ x y))
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": "did not match pattern for let: (let (x) (let* (3) (y x) (+ x y)))",
        "good": false,
        "v": undefined,
      }
    `);
  });

  test('shows error if test program failed during evaluation', () => {
    expect(
      compile_and_run_test(`
        (test
          (let ([x 3]
                [y 'x])
            (+ x y))
          )
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "err": "+: expected all arguments to be numbers but got 3, x",
        "good": false,
        "v": undefined,
      }
    `);
  });
});
