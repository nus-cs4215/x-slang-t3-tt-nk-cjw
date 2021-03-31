(console-log '================)
(console-log 'PRIMITIVE_VALUES)
(console-log '================)
(console-log 'atom) ; atoms
(console-log #t) ; bool
(console-log 1) ; int
(console-log '()) ; nil
(console-log '(1 2 3)) ; list

(console-log '=============)
(console-log 'PRIMITIVE_OPS)
(console-log '=============)

(console-log (let ([a 1] [b 2])
               (+ a b)))

(define x 1)
(define y 2)

(console-log (+ x y))
(console-log (cons x y))
(console-log (cons x (cons y '())))
(console-log (list x y))
(console-log (equal? (list 1 2) (list 1 2)))
(console-log (eq? (list 1 2) (list 1 2)))
