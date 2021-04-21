; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module base '#%builtin-kernel
  (#%require
    private/and-or
    private/car-et-al
    private/compose
    private/cond
    private/define+provide
    private/dict
    private/let
    private/quasiquote
    private/queue
    private/syntax-case
  )
  (#%provide
    quasiquote
    unquote
    and
    or
    let*
    #%module-begin
    #%app
    #%top
    #%datum
    syntax-case
    pattern-match
    pattern-unmatch
    cond
  )
)
; `
; exports.default = contents
; exports.contents = contents

