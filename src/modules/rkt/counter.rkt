; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module counter '#%builtin-kernel
  (#%require cond)

  (define count-manager
    (letrec ([counter 0])
      (#%plain-lambda (command)
       (cond
         ((symbol=? command 'count) counter)
         ((symbol=? command 'inc) (begin (set! counter (+ counter 1)) counter))
         ((symbol=? command 'dec) (begin (set! counter (- counter 1)) counter))
         )
       )
      )
    )

  (define-syntax count
    (#%plain-lambda (stx)
     (count-manager 'count)))

  (define-syntax count-inc
    (#%plain-lambda (stx)
     (count-manager 'inc)))

  (define-syntax count-dec
    (#%plain-lambda (stx)
     (count-manager 'dec)))

  (#%provide count count-inc count-dec)
  )
; `
; exports.default = contents
; exports.contents = contents

