; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module repl-compiler '#%builtin-kernel
  (#%require /libs/racket/base)

  ; We define a syntax-transformer, repl
  ; The transformed program has its last statement wrapped,
  ; to bind it to 'repl-result'
  ; This allows us to return it as evaluation result in our frontend.
  (#%provide repl)

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
                            [modified-last-stmt ~(begin (define repl-result ,last-stmt) (#%provide repl-result))]
                            [modified-last-pair ~(,modified-last-stmt)])
                       modified-last-pair)
                     ; we are not in last pair, recurse
                     (cons (car body) (inserter (cdr body)))
                     ))]
                )
         (inserter body))))

  ;; Syntax-transformer, returns last evaluation value of the syntax
  (define-syntax repl
    (#%plain-lambda (stx)
     (define body (car (cdr stx)))
     (define modified-body (insert-define))
     (console-log body)
     (console-log modified-body)
     modified-body))
  )
; `
; exports.default = contents
; exports.contents = contents

