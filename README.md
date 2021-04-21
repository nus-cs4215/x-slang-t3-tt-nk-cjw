# Racket interpreter

[![Coverage Status](https://coveralls.io/repos/github/nus-cs4215/x-slang-t3-tt-nk-cjw/badge.svg?branch=master)](https://coveralls.io/github/nus-cs4215/x-slang-t3-tt-nk-cjw?branch=master)

## User Guide

We currently provide a non-interactive repl. Run `yarn repl` to see USAGE.

#### Examples

Look at `/examples` for sample `*.rkt` source files. You can run these:

``` sh
yarn repl -v examples/basic.rkt
yarn repl examples/kanren.rkt
```

You can also view [`__tests__/compiler.ts`](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/blob/master/src/compiler/__tests__/compiler.ts), for more examples.

#### Libraries

The [Base Libraries](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/tree/master/src/modules/rkt) we provide can be imported with `(#%require /libs/racket/base)`.

#### A Quick Macro Tutorial <3

[add.rkt](src/demo/macros/add.rkt)

[add-macros-v1.rkt](src/demo/macros/add.rkt)

[add-macros-v2.rkt](src/demo/macros/add.rkt)

[add-macros-v3.rkt](src/demo/macros/add.rkt)

[add-macros-v4.rkt](src/demo/macros/add.rkt)

## Developer Guide

See the [wiki](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/wiki).
