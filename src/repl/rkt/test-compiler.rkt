; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module test-compiler '#%builtin-kernel
  (#%require /libs/racket/base)

  ; We provide new top level forms test, test-lib, and test-libs
  ; They expand to a module form, which imports '#%builtin-kernel
  ; which imports important symbols like #%app and so on.

  ; test then #%require's /libs/racket/base,
  ; which contains our entire standard library
  ; alternatively, use test-lib and test-libs
  ; in order to customize which libraries we require

  ; Then we run the body, replacing the last expression with
  ; (define test-result <last-expression>)

  (#%provide test test-lib test-libs)

  ; Ghetto begin-for-syntax
  ; We are very unhygienic and expect body to be in the environment
  (define-syntax insert-define
    (#%plain-lambda (_)
      '(letrec ([inserter
                  (#%plain-lambda (body)
                   (if
                     (null? (cdr body))
                     ; we are in last pair
                     (let* ([last-stmt (car body)]
                            [modified-last-stmt ~(define test-result ,last-stmt)]
                            [modified-last-pair ~(,modified-last-stmt)])
                       modified-last-pair)
                     ; we are not in last pair, recurse
                     (cons (car body) (inserter (cdr body)))
                     ))]
                )
         (inserter body))))

  (define-syntax test
    (#%plain-lambda (stx)
     (define body (cdr stx))
     (define modified-body (insert-define))
     ~(module test-module '#%builtin-kernel
        (#%require /libs/racket/base)
        (#%provide test-result)
        .  ,modified-body)))

  (define-syntax test-lib
    (#%plain-lambda (stx)
     (define lib (car (cdr stx)))
     (define body (cdr (cdr stx)))
     (define modified-body (insert-define))
     ~(module test-module '#%builtin-kernel
        (#%require ,lib)
        (#%provide test-result)
        .  ,modified-body)))

  (define-syntax test-libs
    (#%plain-lambda (stx)
     (define libs (car (cdr stx)))
     (define body (cdr (cdr stx)))
     (define modified-body (insert-define))
     ~(module test-module '#%builtin-kernel
        (#%require . ,libs)
        (#%provide test-result)
        .  ,modified-body)))

  )
; `
; exports.default = contents
; exports.contents = contents

