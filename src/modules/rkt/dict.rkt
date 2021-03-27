; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module dict '#%builtin-kernel
  (#%require /libs/racket/private/cond)
  ; (VERY BADLY) implements a (VERY SLOW) dict data structure

  ; we provide
  ;   make-dict
  ; which constructs an opaque dict object
  ;   dict-has-key?,
  ;   dict-ref,
  ;   dict-set!
  ; which operate (imperatively) on the dict

  ; i'm sick of writing #%plain-lambda this should be in a library...
  (define-syntax lambda
    (#%plain-lambda (stx) (cons '#%plain-lambda (cdr stx))))

  (define make-dict
    (lambda ()
      (define empty-dict-node
        (lambda (command key value)
          (cond [(symbol=? command 'dict-has+ref)
                 ; empty dict-node always dies
                 (cons #f #f)]
                [(symbol=? command 'dict-set!)
                 ; if we got here, then the key isn't in the dict, so we use new-dict-set!
                 (new-dict-set! key value)]
                )))

      (define dict-node empty-dict-node)

      (define new-dict-set!
        (lambda (this-key this-value)
          (define parent-dict-node dict-node)
          (define new-dict-node
            (lambda (command key value)
              (cond [(symbol=? command 'dict-has+ref)
                     (if (symbol=? key this-key)
                       (cons #t this-value)
                       (parent-dict-node command key value))]
                    [(symbol=? command 'dict-set!)
                     (if (symbol=? key this-key)
                       (set! this-value value)
                       (parent-dict-node command key value))])))
          (set! dict-node new-dict-node)
          ))

      (lambda (command key value)
        (dict-node command key value))))

  (define dict-has-key?
    (lambda (dict key)
      (car (dict 'dict-has+ref key #t))))

  (define dict-ref
    (lambda (dict key)
      (cdr (dict 'dict-has+ref key #t))))

  (define dict-set!
    (lambda (dict key value)
      (dict 'dict-set! key value)))

  (#%provide make-dict dict-has-key? dict-ref dict-set!)

  )
; `
; exports.default = contents
; exports.contents = contents

