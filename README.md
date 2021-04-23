# Racket interpreter

[![Coverage Status](https://coveralls.io/repos/github/nus-cs4215/x-slang-t3-tt-nk-cjw/badge.svg?branch=master)](https://coveralls.io/github/nus-cs4215/x-slang-t3-tt-nk-cjw?branch=master)

## User Guide

We currently provide a cli tool for running Racket scripts. Run `yarn start` to see USAGE.

#### Examples

Look at `/examples` for sample `*.rkt` source files. You can run these:

``` sh
yarn start -v examples/basic.rkt
yarn start examples/kanren.rkt
```

You can also view [`__tests__/compiler.ts`](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/blob/master/src/compiler/__tests__/compiler.ts), for more examples.

#### Libraries

The [Base Libraries](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/tree/master/src/modules/rkt) we provide can be imported with `(#%require /libs/racket/base)`.

#### Other Tutorials

- [Porting Programs from other Lisps](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/wiki/Porting-Programs-from-other-Lisps)

- [Macros By Example](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/wiki/Macro-Tutorial-By-Example)

## Developer Guide

See the [wiki](https://github.com/nus-cs4215/x-slang-t3-tt-nk-cjw/wiki).
