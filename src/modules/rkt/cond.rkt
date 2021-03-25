; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module cond '#%builtin-kernel
  (#%require quasiquote)

  (define-syntax cond
    (#%plain-lambda (stx)
      (define cond-clause (cdr stx))
      (if (null? cond-clause)
        ''no_match
        ~(if ,(car (car cond-clause))
          (begin . ,(cdr (car cond-clause)))
          (cond . ,(cdr cond-clause))))))
  (#%provide cond)
  )
; `
; exports.default = contents
; exports.contents = contents
