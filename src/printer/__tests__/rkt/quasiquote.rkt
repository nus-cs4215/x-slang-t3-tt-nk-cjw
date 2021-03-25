; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module quasiquote '#%builtin-kernel
  (define-syntax and3
    (#%plain-lambda (stx)
     (list 'if
           (car (cdr stx))
           (list 'if
                 (car (cdr (cdr stx)))
                 (car (cdr (cdr (cdr stx))))
                 #f)
           #f)))
  (define-syntax quasiquote
    (#%plain-lambda (quasiquote+stx)
     (define stx (car (cdr quasiquote+stx)))
     (if (cons? stx)
       (if (and3 (symbol=? (car stx) 'unquote)
                 (cons? (cdr stx))
                 (null? (cdr (cdr stx))))
         (car (cdr stx))
         (list 'cons
               (list 'quasiquote (car stx))
               (list 'quasiquote (cdr stx))))
       (list 'quote stx))))
  (define-syntax unquote
    (#%plain-lambda (stx)
     '(error unquote not allowed outside quasiquote . error)))
  (#%provide quasiquote unquote)
  )
; `
; exports.default = contents
; exports.contents = contents

