;; From the previous section we can examine the generated syntax:
;; (define add__
;;   (#%plain-lambda (a b) (begin (console-log a) (console-log b) (+ a b)))
;;   )
;;
;; Defun with quasiquote
(define-syntax defun-qq
  (#%plain-lambda (stx)
    (console-log stx)
    (let ([func-name (car (cdr stx))]
          [args (car (cdr (cdr stx)))]
          [body (cdr (cdr (cdr stx)))])
      (let ([defun-stx
        ~(define ,func-name
          (#%plain-lambda ,args ,(cons 'begin body)))])
        (console-log 'Generated-syntax: defun-stx)
        (console-log)
        defun-stx))))

(defun-qq add___ (a b)
  (console-log a)
  (console-log b)
  (+ a b))

(console-log (add___ 1 2))

;; Defun with syntax-case
