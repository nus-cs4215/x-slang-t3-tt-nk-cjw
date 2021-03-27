; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module base '#%builtin-kernel
  (#%require private/quasiquote private/and-or private/let)
  (#%provide quasiquote unquote and or let*)
  )
; `
; exports.default = contents
; exports.contents = contents

