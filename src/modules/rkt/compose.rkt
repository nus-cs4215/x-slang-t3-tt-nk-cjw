; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module compose '#%builtin-kernel
  (#%require quasiquote)

  (define-syntax compose-syntax
    (#%plain-lambda (compose-syntax+fs)
     (define fs (cdr compose-syntax+fs))
     (define make-func-calls-stx
       (#%plain-lambda (fs)
         (if (null? fs)
           'x
           ~(,(car fs) ,(make-func-calls-stx (cdr fs))))))
     (define func-calls-stx (make-func-calls-stx fs))
     ~(#%plain-lambda (x) ,func-calls-stx)))

  (define compose
    (#%plain-lambda (fs)
     (#%plain-lambda (x)
      (letrec ([folder
                 (#%plain-lambda (fs)
                  (if (null? fs)
                    x
                    ((car fs) (folder (cdr fs)))))])
        (folder fs)))))

  (#%provide compose-syntax compose)

  )
; `
; exports.default = contents
; exports.contents = contents

