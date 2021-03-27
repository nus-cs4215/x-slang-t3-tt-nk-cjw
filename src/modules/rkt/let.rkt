; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module let '#%builtin-kernel
  (#%require quasiquote)
  (define-syntax let*
    (#%plain-lambda (let*+stx)
     (define stx (cdr let*+stx))
     (define bindings (car stx))
     (define body (cdr stx))
     (if (null? bindings)
       (cons 'begin body) ; use begin because body is multiple statements
       ~(let (,(car bindings)) (let* ,(cdr bindings) . ,body)))))
  (#%provide let*)
  )
; `
; exports.default = contents
; exports.contents = contents

