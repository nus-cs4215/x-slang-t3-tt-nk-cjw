(#%require /libs/racket/private/car-et-al)
(define-syntax snd
  (#%plain-lambda (stx)
    (caddr stx)))

(snd 1 2)
