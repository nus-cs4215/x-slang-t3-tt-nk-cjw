; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module define+provide '#%builtin-kernel
  (#%require quasiquote)

  (define-syntax define+provide
    (#%plain-lambda (stx)
     (define name (car (cdr stx)))
     (define value (car (cdr (cdr stx))))
     ~(begin (define ,name ,value) (#%provide ,name))))

  (#%provide define+provide)

  )
; `
; exports.default = contents
; exports.contents = contents

