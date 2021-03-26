import { compile_and_run_test } from '../../testing/test-runner';

test('queue', () => {
  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (make-queue)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define test-result
          (#%plain-app (#%variable-reference make-queue))
          )
        )
      )",
        "evaluated": "#boxed",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        q
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (define test-result (#%variable-reference q))
        )
      )",
        "evaluated": "#boxed",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        (dequeue! q)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dequeue!)
            (#%variable-reference q)
            )
          )
        )
      )",
        "evaluated": "1",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        (enqueue! q 2)
        (enqueue! q 3)
        (dequeue! q)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 2)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 3)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dequeue!)
            (#%variable-reference q)
            )
          )
        )
      )",
        "evaluated": "1",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        (enqueue! q 2)
        (enqueue! q 3)
        (dequeue! q)
        (dequeue! q)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 2)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 3)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dequeue!)
            (#%variable-reference q)
            )
          )
        )
      )",
        "evaluated": "2",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        (enqueue! q 2)
        (enqueue! q 3)
        (dequeue! q)
        (dequeue! q)
        (enqueue! q 4)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 2)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 3)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference enqueue!)
            (#%variable-reference q)
            (quote 4)
            )
          )
        )
      )",
        "evaluated": "4",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        (enqueue! q 2)
        (enqueue! q 3)
        (dequeue! q)
        (dequeue! q)
        (enqueue! q 4)
        (dequeue! q)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 2)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 3)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 4)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dequeue!)
            (#%variable-reference q)
            )
          )
        )
      )",
        "evaluated": "3",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/queue
        (define q (make-queue))
        (enqueue! q 1)
        (enqueue! q 2)
        (enqueue! q 3)
        (dequeue! q)
        (dequeue! q)
        (enqueue! q 4)
        (dequeue! q)
        (dequeue! q)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/queue)
        (#%provide test-result)
        (define q (#%plain-app (#%variable-reference make-queue)))
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 1)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 2)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 3)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (#%plain-app
          (#%variable-reference enqueue!)
          (#%variable-reference q)
          (quote 4)
          )
        (#%plain-app
          (#%variable-reference dequeue!)
          (#%variable-reference q)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dequeue!)
            (#%variable-reference q)
            )
          )
        )
      )",
        "evaluated": "4",
      },
    }
  `);
});
