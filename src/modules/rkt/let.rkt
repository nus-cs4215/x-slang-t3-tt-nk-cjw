; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module let '#%builtin-kernel
  (define-syntax let*
    (#%plain-lambda (let*+stx)
     (define stx (cdr let*+stx))
     (define bindings (car stx))
     (define body (cdr stx))
     (if (null? bindings)
       (cons 'begin body) ; use begin because body is multiple statements
       (cons 'let
             (cons (cons (car bindings) '())
                   (cons (cons 'let* (cons (cdr bindings) body))
                         '()))))))
  (#%provide let*)
  )
; `
; exports.default = contents
; exports.contents = contents

