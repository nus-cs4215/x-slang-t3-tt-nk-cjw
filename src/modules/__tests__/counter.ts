import { compile_and_run_test } from '../../testing/test-runner';

test('count', () => {
  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/counter
        (list count count-inc count-inc count count count-dec count)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/counter)
        (#%provide test-result)
        (define test-result
          (#%plain-app
            (#%variable-reference list)
            (quote 0)
            (quote 1)
            (quote 2)
            (quote 2)
            (quote 2)
            (quote 1)
            (quote 1)
            )
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "(0 1 2 2 2 1 1)",
      },
    }
  `);
});
