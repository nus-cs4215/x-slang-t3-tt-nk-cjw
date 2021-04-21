; Defun which supports a single body statement
(module add '#%builtin-base-lang
    (define-syntax defun
    (#%plain-lambda (stx)
                    (let ([func-name (car (cdr stx))]
                            [args (car (cdr (cdr stx)))]
                            [body (car (cdr (cdr (cdr stx))))])
                        (console-log func-name)
                        (console-log args)
                        (console-log body)
                        (list 'define func-name
                            (list '#%plain-lambda args body)))))

    (defun add (a b)
    (+ a b)) ; Only 1 body statement

    (add 1 2)
)
