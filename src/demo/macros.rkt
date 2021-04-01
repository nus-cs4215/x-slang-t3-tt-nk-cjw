(define add
  (#%plain-lambda (a b)
    (+ a b)))

(add 1 2)

; Single body stmts
(define-syntax defun1
   (#%plain-lambda (stx)
                   (let ([func-name (car (cdr stx))]
                         [args (car (cdr (cdr stx)))]
                         [body (car (cdr (cdr (cdr stx))))])
                     (console-log func-name)
                     (console-log args)
                     (console-log body)
                     (list 'define func-name
                           (list '#%plain-lambda args body)))))

(defun1 add_ (a b)
  (+ a b))

(add_ 1 2)

;; Multi body stmts
(define-syntax defun
  (#%plain-lambda (stx)
    (let ([func-name (car (cdr stx))]
          [args (car (cdr (cdr stx)))]
          [body (cdr (cdr (cdr stx)))])
      (console-log func-name)
      (console-log args)
      (console-log body)
      (let ([defun-stx
        (list 'define func-name
          (list '#%plain-lambda args (cons 'begin body)))])
        (console-log defun-stx)
        defun-stx))))

(defun add__ (a b)
  (console-log a)
  (console-log b)
  (+ a b))

(add__ 1 2)
