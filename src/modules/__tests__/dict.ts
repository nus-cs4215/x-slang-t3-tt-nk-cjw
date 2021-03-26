import { compile_and_run_test } from '../../testing/test-runner';

test('dict', () => {
  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (make-dict)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define test-result (#%plain-app (#%variable-reference make-dict)))
        )
      )",
        "evaluated": "#boxed",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-has-key? d 'a)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (define test-result
          (#%plain-app
            (#%variable-reference dict-has-key?)
            (#%variable-reference d)
            (quote a)
            )
          )
        )
      )",
        "evaluated": "#f",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        d
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (define test-result (#%variable-reference d))
        )
      )",
        "evaluated": "#boxed",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-has-key? d 'a)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-has-key?)
            (#%variable-reference d)
            (quote a)
            )
          )
        )
      )",
        "evaluated": "#t",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-has-key? d 'b)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-has-key?)
            (#%variable-reference d)
            (quote b)
            )
          )
        )
      )",
        "evaluated": "#f",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-ref d 'a)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote a)
            )
          )
        )
      )",
        "evaluated": "5",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-ref d 'b)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote b)
            )
          )
        )
      )",
        "evaluated": "#f",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-has-key? d 'a)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-has-key?)
            (#%variable-reference d)
            (quote a)
            )
          )
        )
      )",
        "evaluated": "#t",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-has-key? d 'b)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-has-key?)
            (#%variable-reference d)
            (quote b)
            )
          )
        )
      )",
        "evaluated": "#t",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-has-key? d 'c)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-has-key?)
            (#%variable-reference d)
            (quote c)
            )
          )
        )
      )",
        "evaluated": "#f",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-ref d 'a)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote a)
            )
          )
        )
      )",
        "evaluated": "5",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-ref d 'b)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote b)
            )
          )
        )
      )",
        "evaluated": "6",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-ref d 'c)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote c)
            )
          )
        )
      )",
        "evaluated": "#f",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-set! d 'a 7)
        (dict-ref d 'a)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 7)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote a)
            )
          )
        )
      )",
        "evaluated": "7",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/dict
        (define d (make-dict))
        (dict-set! d 'a 5)
        (dict-set! d 'b 6)
        (dict-set! d 'a 7)
        (dict-ref d 'b)
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "compiled": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/dict)
        (#%provide test-result)
        (define d (#%plain-app (#%variable-reference make-dict)))
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 5)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote b)
          (quote 6)
          )
        (#%plain-app
          (#%variable-reference dict-set!)
          (#%variable-reference d)
          (quote a)
          (quote 7)
          )
        (define test-result
          (#%plain-app
            (#%variable-reference dict-ref)
            (#%variable-reference d)
            (quote b)
            )
          )
        )
      )",
        "evaluated": "6",
      },
    }
  `);
});
