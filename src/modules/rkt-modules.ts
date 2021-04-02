import and_or_lib from './rkt/and-or.rkt';
import base_lib from './rkt/base.rkt';
import car_et_al_lib from './rkt/car-et-al.rkt';
import compose_lib from './rkt/compose.rkt';
import cond_lib from './rkt/cond.rkt';
import counter_lib from './rkt/counter.rkt';
import define_provide_lib from './rkt/define+provide.rkt';
import dict_lib from './rkt/dict.rkt';
import let_lib from './rkt/let.rkt';
import quasiquote_lib from './rkt/quasiquote.rkt';
import queue_lib from './rkt/queue.rkt';
import syntax_case_lib from './rkt/syntax-case.rkt';

export const libs: readonly [string, string][] = [
  ['/libs/racket/private/and-or.rkt', and_or_lib],
  ['/libs/racket/base.rkt', base_lib],
  ['/libs/racket/private/car-et-al.rkt', car_et_al_lib],
  ['/libs/racket/private/compose.rkt', compose_lib],
  ['/libs/racket/private/cond.rkt', cond_lib],
  ['/libs/racket/private/counter.rkt', counter_lib],
  ['/libs/racket/private/define+provide.rkt', define_provide_lib],
  ['/libs/racket/private/dict.rkt', dict_lib],
  ['/libs/racket/private/let.rkt', let_lib],
  ['/libs/racket/private/quasiquote.rkt', quasiquote_lib],
  ['/libs/racket/private/queue.rkt', queue_lib],
  ['/libs/racket/private/syntax-case.rkt', syntax_case_lib],
];
