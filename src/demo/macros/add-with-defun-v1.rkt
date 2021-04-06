; Defun which supports a single body statement
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
  (+ a b)) ; Only 1 body statement

(add_ 1 2)
