import { FEPClosure } from '../../evaluator/datatypes';
import { print } from '../../printer';
import { SBoxed } from '../../sexpr';
import {
  compile_and_run_test,
  compile_and_run_test_without_print,
} from '../../testing/test-runner';
import { getOk } from '../../utils';

test('car et al', () => {
  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/car-et-al
        (caar '((1 2 3) (4 5 6)))
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caar) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "1",
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
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference cadar) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "2",
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
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caddar) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "3",
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
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference cadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "(4 5 6)",
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
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "4",
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
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference cadadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "5",
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
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/car-et-al)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference caddadr) (quote ((1 2 3) (4 5 6))))
          )
        )
      )",
        "evaluated": "6",
      },
    }
  `);

  // Check that the FEP is just 1 function with lots of applications,
  // not many nested closures,
  // and also all the applications are in the right order
  expect(
    print(
      (getOk(
        compile_and_run_test_without_print(`
          (test-lib /libs/racket/private/car-et-al
            caddadr
            )
          `)
      ).evaluated as SBoxed<FEPClosure>).val.body.x
    )
  ).toMatchInlineSnapshot(`
    "(#%plain-app
      (#%variable-reference car)
      (#%plain-app
        (#%variable-reference cdr)
        (#%plain-app
          (#%variable-reference cdr)
          (#%plain-app
            (#%variable-reference car)
            (#%plain-app (#%variable-reference cdr) (#%variable-reference x))
            )
          )
        )
      )"
  `);
});
