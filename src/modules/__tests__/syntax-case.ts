import { compile_and_run_test } from '../../testing/test-runner';

test('syntax-case', () => {
  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/syntax-case
        (syntax-case '(#%app + 1 2 3)
          [('#%app f x ...) ('#%plain-app f x ...)]
          )
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/syntax-case)
        (#%provide test-result)
        (define test-result
          (let ((s-c-input__ (quote (#%app + 1 2 3))))
            (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum #%app) (cons (var f) (star (var x) (datum ()))))) ) ))
              (let
                  ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                    (s-c-match-object
                      (#%plain-app
                        (#%variable-reference cdr)
                        (#%variable-reference s-c-match-result__)
                        )
                      )
                    )
                (if (#%variable-reference s-c-match-success?)
                  (#%plain-app
                    (#%variable-reference cdr)
                    (#%plain-app
                      (#%variable-reference pattern-unmatch)
                      (#%variable-reference s-c-match-object)
                      (quote (cons (datum #%plain-app) (cons (var f) (star (var x) (datum ())))))
                      )
                    )
                  (quote no-match)
                  )
                )
              )
            )
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "(#%plain-app + 1 2 3)",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/syntax-case
        (syntax-case '(#%app + 1 2 3)
          [('lambda (args ...) body ...+) ('#%plain-lambda (args ...) body ...+)]
          [('#%app f x ...) ('#%plain-app f x ...)]
          )
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/syntax-case)
        (#%provide test-result)
        (define test-result
          (let ((s-c-input__ (quote (#%app + 1 2 3))))
            (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum lambda) (cons (star (var args) (datum ())) (plus (var body) (datum ())))) ) ) ))
              (let
                  ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                    (s-c-match-object
                      (#%plain-app
                        (#%variable-reference cdr)
                        (#%variable-reference s-c-match-result__)
                        )
                      )
                    )
                (if (#%variable-reference s-c-match-success?)
                  (#%plain-app
                    (#%variable-reference cdr)
                    (#%plain-app
                      (#%variable-reference pattern-unmatch)
                      (#%variable-reference s-c-match-object)
                      (quote
                        (cons
                          (datum #%plain-lambda)
                          (cons (star (var args) (datum ())) (plus (var body) (datum ())))
                          )
                        )
                      )
                    )
                  (let ((s-c-input__ (#%variable-reference s-c-input__)))
                    (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum #%app) (cons (var f) (star (var x) (datum ()))))) ) ))
                      (let
                          ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                            (s-c-match-object
                              (#%plain-app
                                (#%variable-reference cdr)
                                (#%variable-reference s-c-match-result__)
                                )
                              )
                            )
                        (if (#%variable-reference s-c-match-success?)
                          (#%plain-app
                            (#%variable-reference cdr)
                            (#%plain-app
                              (#%variable-reference pattern-unmatch)
                              (#%variable-reference s-c-match-object)
                              (quote (cons (datum #%plain-app) (cons (var f) (star (var x) (datum ())))))
                              )
                            )
                          (quote no-match)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "(#%plain-app + 1 2 3)",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/syntax-case
        (syntax-case '(lambda (x y) (+ x y))
          [('lambda (args ...) body ...+) ('#%plain-lambda (args ...) body ...+)]
          [('#%app f x ...) ('#%plain-app f x ...)]
          )
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/syntax-case)
        (#%provide test-result)
        (define test-result
          (let ((s-c-input__ (quote (lambda (x y) (+ x y)))))
            (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum lambda) (cons (star (var args) (datum ())) (plus (var body) (datum ())))) ) ) ))
              (let
                  ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                    (s-c-match-object
                      (#%plain-app
                        (#%variable-reference cdr)
                        (#%variable-reference s-c-match-result__)
                        )
                      )
                    )
                (if (#%variable-reference s-c-match-success?)
                  (#%plain-app
                    (#%variable-reference cdr)
                    (#%plain-app
                      (#%variable-reference pattern-unmatch)
                      (#%variable-reference s-c-match-object)
                      (quote
                        (cons
                          (datum #%plain-lambda)
                          (cons (star (var args) (datum ())) (plus (var body) (datum ())))
                          )
                        )
                      )
                    )
                  (let ((s-c-input__ (#%variable-reference s-c-input__)))
                    (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum #%app) (cons (var f) (star (var x) (datum ()))))) ) ))
                      (let
                          ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                            (s-c-match-object
                              (#%plain-app
                                (#%variable-reference cdr)
                                (#%variable-reference s-c-match-result__)
                                )
                              )
                            )
                        (if (#%variable-reference s-c-match-success?)
                          (#%plain-app
                            (#%variable-reference cdr)
                            (#%plain-app
                              (#%variable-reference pattern-unmatch)
                              (#%variable-reference s-c-match-object)
                              (quote (cons (datum #%plain-app) (cons (var f) (star (var x) (datum ())))))
                              )
                            )
                          (quote no-match)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "(#%plain-lambda (x y) (+ x y))",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/syntax-case
        (syntax-case '(lambda () (+ 1 2 3))
          [('lambda (args ...) body ...+) ('#%plain-lambda (args ...) body ...+)]
          [('#%app f x ...) ('#%plain-app f x ...)]
          )
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/syntax-case)
        (#%provide test-result)
        (define test-result
          (let ((s-c-input__ (quote (lambda () (+ 1 2 3)))))
            (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum lambda) (cons (star (var args) (datum ())) (plus (var body) (datum ())))) ) ) ))
              (let
                  ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                    (s-c-match-object
                      (#%plain-app
                        (#%variable-reference cdr)
                        (#%variable-reference s-c-match-result__)
                        )
                      )
                    )
                (if (#%variable-reference s-c-match-success?)
                  (#%plain-app
                    (#%variable-reference cdr)
                    (#%plain-app
                      (#%variable-reference pattern-unmatch)
                      (#%variable-reference s-c-match-object)
                      (quote
                        (cons
                          (datum #%plain-lambda)
                          (cons (star (var args) (datum ())) (plus (var body) (datum ())))
                          )
                        )
                      )
                    )
                  (let ((s-c-input__ (#%variable-reference s-c-input__)))
                    (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum #%app) (cons (var f) (star (var x) (datum ()))))) ) ))
                      (let
                          ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                            (s-c-match-object
                              (#%plain-app
                                (#%variable-reference cdr)
                                (#%variable-reference s-c-match-result__)
                                )
                              )
                            )
                        (if (#%variable-reference s-c-match-success?)
                          (#%plain-app
                            (#%variable-reference cdr)
                            (#%plain-app
                              (#%variable-reference pattern-unmatch)
                              (#%variable-reference s-c-match-object)
                              (quote (cons (datum #%plain-app) (cons (var f) (star (var x) (datum ())))))
                              )
                            )
                          (quote no-match)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "(#%plain-lambda () (+ 1 2 3))",
      },
    }
  `);

  expect(
    compile_and_run_test(`
      (test-lib /libs/racket/private/syntax-case
        (syntax-case '(lambda (x y))
          [('lambda (args ...) body ...+) ('#%plain-lambda (args ...) body ...+)]
          [('#%app f x ...) ('#%plain-app f x ...)]
          )
        )
      `)
  ).toMatchInlineSnapshot(`
    Object {
      "compiled": Object {
        "err": undefined,
        "good": true,
        "v": "(module test-module (quote #%builtin-kernel)
      (#%plain-module-begin
        (#%require /libs/racket/private/syntax-case)
        (#%provide test-result)
        (define test-result
          (let ((s-c-input__ (quote (lambda (x y)))))
            (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum lambda) (cons (star (var args) (datum ())) (plus (var body) (datum ())))) ) ) ))
              (let
                  ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                    (s-c-match-object
                      (#%plain-app
                        (#%variable-reference cdr)
                        (#%variable-reference s-c-match-result__)
                        )
                      )
                    )
                (if (#%variable-reference s-c-match-success?)
                  (#%plain-app
                    (#%variable-reference cdr)
                    (#%plain-app
                      (#%variable-reference pattern-unmatch)
                      (#%variable-reference s-c-match-object)
                      (quote
                        (cons
                          (datum #%plain-lambda)
                          (cons (star (var args) (datum ())) (plus (var body) (datum ())))
                          )
                        )
                      )
                    )
                  (let ((s-c-input__ (#%variable-reference s-c-input__)))
                    (let ((s-c-match-result__ (#%plain-app (#%variable-reference pattern-match) (#%variable-reference s-c-input__) (quote (cons (datum #%app) (cons (var f) (star (var x) (datum ()))))) ) ))
                      (let
                          ((s-c-match-success? (#%plain-app (#%variable-reference car) (#%variable-reference s-c-match-result__) ) )
                            (s-c-match-object
                              (#%plain-app
                                (#%variable-reference cdr)
                                (#%variable-reference s-c-match-result__)
                                )
                              )
                            )
                        (if (#%variable-reference s-c-match-success?)
                          (#%plain-app
                            (#%variable-reference cdr)
                            (#%plain-app
                              (#%variable-reference pattern-unmatch)
                              (#%variable-reference s-c-match-object)
                              (quote (cons (datum #%plain-app) (cons (var f) (star (var x) (datum ())))))
                              )
                            )
                          (quote no-match)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )",
      },
      "evaluated": Object {
        "err": undefined,
        "good": true,
        "v": "no-match",
      },
    }
  `);
});
