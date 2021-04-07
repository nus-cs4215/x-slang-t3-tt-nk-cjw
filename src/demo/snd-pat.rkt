(#%require /libs/racket/private/car-et-al)
(#%require /libs/racket/private/syntax-case)
(define-syntax snd
  (#%plain-lambda (stx)
    (syntax-case stx
        [('snd a b) b])))

(snd 1 2)
