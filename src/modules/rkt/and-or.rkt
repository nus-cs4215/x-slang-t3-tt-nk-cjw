; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module quasiquote '#%builtin-kernel
  (#%require quasiquote)
  (define-syntax and
    (#%plain-lambda (and+stx)
     (define stx (cdr and+stx))
     (if (null? stx) ; zero args
       #t
       (if (null? (cdr stx)) ; one arg
         (car stx)
         ~(if ,(car stx) (and . ,(cdr stx)) #f)))))
  (define-syntax or
    (#%plain-lambda (or+stx)
     (define stx (cdr or+stx))
     (if (null? stx) ; zero args
       #f
       (if (null? (cdr stx)) ; one arg
         (car stx)
         ~(let [(fst ,(car stx))]
            (if fst
              fst
              (or . ,(cdr stx))))))))
  (#%provide and or)
  )
; `
; exports.default = contents
; exports.contents = contents

