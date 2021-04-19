(module name '#%builtin-base-lang
  (define f (lambda (x) x))
  (define g 1)
  (#%provide g))

g
