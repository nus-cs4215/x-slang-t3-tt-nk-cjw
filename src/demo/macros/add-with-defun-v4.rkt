;;
(module add '#%builtin-base-lang
  (#%require /libs/racket/base)
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
  ;; Defun with syntax-case
  (#%require /libs/racket/private/syntax-case)
  (define-syntax defun
    (#%plain-lambda (stx)

      (console-log)
      (console-log 'Input-syntax: stx)
      (console-log)
      (console-log 'Generated-syntax: (syntax-case stx
        [('defun f (args ...) body ...+)
        ('define f
          ('#%plain-lambda (args ...) body ...+))]))
      ))

  (defun add (a b) (+ a b))

  (compile-log =================)
  (compile-log COMPILE-PHASE-END)
  (compile-log =================)

  (console-log)
  (add 1 2)
)
