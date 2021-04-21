;; Multi body stmts
(module add '#%builtin-base-lang
  (define-syntax compile-log
    (#%plain-lambda (stx)
      (console-log (car (cdr stx)))
      '0))

  (compile-log ===================)
  (compile-log COMPILE-PHASE-BEGIN)
  (compile-log ===================)

  (define-syntax defun
    (#%plain-lambda (stx)
      (console-log)
      (let ([func-name (car (cdr stx))]
            [args (car (cdr (cdr stx)))]
            [body (cdr (cdr (cdr stx)))])
        (console-log 'func-name: func-name)
        (console-log)
        (console-log 'args: args)
        (console-log)
        (console-log 'body body)
        (console-log)
        (let ([defun-stx
          (list 'define func-name
            (list '#%plain-lambda args (cons 'begin body)))])
          (console-log 'Generated-syntax: defun-stx)
          (console-log)
          defun-stx))))

  (console-log)
  (console-log '================)
  (console-log 'EVAL-PHASE-BEGIN)
  (console-log '================)


  (defun add (a b)
    (console-log a) ; Multiple
    (console-log b) ; statements
    (+ a b))        ; returning the last one.

  (compile-log =================)
  (compile-log COMPILE-PHASE-END)
  (compile-log =================)

  (add 1 2)
)
