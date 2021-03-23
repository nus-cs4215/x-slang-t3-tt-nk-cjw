import and_or_lib from './rkt/and-or.rkt';
import base_lib from './rkt/base.rkt';
import let_lib from './rkt/let.rkt';
import quasiquote_lib from './rkt/quasiquote.rkt';

export const libs: readonly [string, string][] = [
  ['/libs/racket/private/and-or.rkt', and_or_lib],
  ['/libs/racket/base.rkt', base_lib],
  ['/libs/racket/private/let.rkt', let_lib],
  ['/libs/racket/private/quasiquote.rkt', quasiquote_lib],
];
