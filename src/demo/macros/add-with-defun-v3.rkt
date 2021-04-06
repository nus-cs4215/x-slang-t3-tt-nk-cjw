(define-syntax compile-log
  (#%plain-lambda (stx)
    (console-log (car (cdr stx)))
    '0))

(compile-log ===================)
(compile-log COMPILE-PHASE-BEGIN)
(compile-log ===================)

;; From the previous section we can examine the generated syntax:
;; (define add__
;;   (#%plain-lambda (a b) (begin (console-log a) (console-log b) (+ a b)))
;;   )
;;
;; Defun with quasiquote
(define-syntax defun
  (#%plain-lambda (stx)
    (console-log 'Input-syntax:)
    (console-log stx)
    (console-log)
    (let ([func-name (car (cdr stx))]
          [args (car (cdr (cdr stx)))]
          [body (cdr (cdr (cdr stx)))])
      (let ([defun-stx
        ~(define ,func-name
          (#%plain-lambda ,args ,(cons 'begin body)))])
        (console-log 'Generated-syntax: defun-stx)
        (console-log)
        defun-stx))))

(console-log)
(console-log '================)
(console-log 'EVAL-PHASE-BEGIN)
(console-log '================)

(defun add (a b)
  (console-log a)
  (console-log b)
  (+ a b))

(compile-log =================)
(compile-log COMPILE-PHASE-END)
(compile-log =================)

(console-log (add 1 2))
