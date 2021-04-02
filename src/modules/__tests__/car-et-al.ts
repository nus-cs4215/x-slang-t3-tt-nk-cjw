import { compile_and_run_test } from '../../testing/test-runner';

test('car et al', () => {
  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (caar '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caar) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "1",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (cadar '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference cadar) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "2",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (caddar '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caddar) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "3",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (cadr '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference cadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "(4 5 6)",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (caadr '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "4",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (cadadr '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference cadadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "5",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (caddadr '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caddadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "6",
      },
    }
  `);
});
