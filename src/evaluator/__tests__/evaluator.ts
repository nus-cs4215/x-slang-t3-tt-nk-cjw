import { make_empty_bindings, make_env, make_env_list } from '../../environment';
import { set_define } from '../../environment/environment';
import { ExprForm, ExprOrDefineForm } from '../../fep-types';
import { primitives_module } from '../../modules';
import { read } from '../../reader';
import { sboolean, snumber, ssymbol } from '../../sexpr';
import { sbox, slist, snil, SNonemptyHomList } from '../../sexpr/sexpr';
import { getOk, ok } from '../../utils';
import { getErr, isGoodResult } from '../../utils/result';
import { make_fep_closure } from '../datatypes';
import { evaluate_expr_or_define } from '../evaluator';

const the_global_environment = make_env_list(primitives_module.provides);

const test_env = () => make_env(make_empty_bindings(), the_global_environment);

describe('evaluate_general_top_level', () => {
  test('evaluate quote', () => {
    expect(
      evaluate_expr_or_define(getOk(read('(quote 1)')) as ExprOrDefineForm, undefined)
    ).toEqual(ok(snumber(1)));

    expect(
      evaluate_expr_or_define(getOk(read('(quote #t)')) as ExprOrDefineForm, undefined)
    ).toEqual(ok(sboolean(true)));

    expect(
      evaluate_expr_or_define(getOk(read('(quote a)')) as ExprOrDefineForm, undefined)
    ).toEqual(ok(ssymbol('a')));
  });

  test('evaluate if', () => {
    expect(
      evaluate_expr_or_define(
        getOk(read('(if (quote #t) (quote 1) (quote 2))')) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(snumber(1)));

    expect(
      evaluate_expr_or_define(
        getOk(read('(if (quote a) (quote 1) (quote 2))')) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(snumber(1)));

    expect(
      evaluate_expr_or_define(
        getOk(read('(if (quote 100) (quote 1) (quote 2))')) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(snumber(1)));

    expect(
      evaluate_expr_or_define(
        getOk(read('(if (quote #f) (quote 1) (quote 2))')) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(snumber(2)));
  });

  test('evaluate begin', () => {
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(begin
                  (quote a)
                  (quote b)
                  (quote 1))`)
        ) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(snumber(1)));

    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(begin
                  (quote a)
                  (quote b)
                  (quote c))`)
        ) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(ssymbol('c')));
  });

  test('evaluate begin0', () => {
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(begin0
                  (quote a)
                  (quote b)
                  (quote 1))`)
        ) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(ssymbol('a')));
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(begin0
                  (quote a)
                  (quote b)
                  (quote c))`)
        ) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(ok(ssymbol('a')));
  });

  test('evaluate #%variable-reference', () => {
    const env = test_env();
    set_define(env.bindings, 'x', snumber(10));
    set_define(env.bindings, 'y', sboolean(true));
    set_define(env.bindings, 'z', ssymbol('hi'));
    expect(
      evaluate_expr_or_define(getOk(read('(#%variable-reference x)')) as ExprOrDefineForm, env)
    ).toEqual(ok(snumber(10)));
    expect(
      evaluate_expr_or_define(getOk(read('(#%variable-reference y)')) as ExprOrDefineForm, env)
    ).toEqual(ok(sboolean(true)));
    expect(
      evaluate_expr_or_define(getOk(read('(#%variable-reference z)')) as ExprOrDefineForm, env)
    ).toEqual(ok(ssymbol('hi')));
  });

  test('evaluate define', () => {
    const env = test_env();
    expect(
      isGoodResult(
        evaluate_expr_or_define(getOk(read(`(define x (quote 10))`)) as ExprOrDefineForm, env)
      )
    ).toEqual(true);
    expect(
      isGoodResult(
        evaluate_expr_or_define(getOk(read(`(define y (quote #t))`)) as ExprOrDefineForm, env)
      )
    ).toEqual(true);
    expect(
      isGoodResult(
        evaluate_expr_or_define(getOk(read(`(define z (quote hi))`)) as ExprOrDefineForm, env)
      )
    ).toEqual(true);
    expect(
      evaluate_expr_or_define(getOk(read(`(#%variable-reference x)`)) as ExprOrDefineForm, env)
    ).toEqual(ok(snumber(10)));
    expect(
      evaluate_expr_or_define(getOk(read(`(#%variable-reference y)`)) as ExprOrDefineForm, env)
    ).toEqual(ok(sboolean(true)));
    expect(
      evaluate_expr_or_define(getOk(read(`(#%variable-reference z)`)) as ExprOrDefineForm, env)
    ).toEqual(ok(ssymbol('hi')));
  });

  test('evaluate let', () => {
    const env = test_env();
    set_define(env.bindings, 'x', snumber(10));
    set_define(env.bindings, 'y', sboolean(true));
    expect(
      evaluate_expr_or_define(
        getOk(read(`(let ([x (quote 1)]) (#%variable-reference x))`)) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snumber(1)));
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(let ([x (#%variable-reference y)]) (#%variable-reference x))`)
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(sboolean(true)));
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(let ([x (quote 2)] [y (#%variable-reference x)]) (#%variable-reference y))`)
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snumber(10)));
  });

  test('evaluate letrec', () => {
    const env = test_env();
    set_define(env.bindings, 'x', snumber(10));
    set_define(env.bindings, 'y', sboolean(true));
    expect(
      evaluate_expr_or_define(
        getOk(read(`(letrec ([x (quote 1)]) (#%variable-reference x))`)) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snumber(1)));
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(letrec ([x (#%variable-reference y)]) (#%variable-reference x))`)
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(sboolean(true)));
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(letrec ([x (quote 2)] [y (#%variable-reference x)]) (#%variable-reference y))`)
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snumber(2)));
    expect(
      getErr(
        evaluate_expr_or_define(
          getOk(
            read(
              `(letrec ([x (#%variable-reference y)]
                      [y (#%variable-reference x)])
                (#%variable-reference y))`
            )
          ) as ExprOrDefineForm,
          env
        )
      )
    ).toMatchInlineSnapshot(
      `"evaluate (#%variable-reference): tried to use variable y before initialization"`
    );
  });

  test('evaluate #%plain-lambda', () => {
    expect(
      evaluate_expr_or_define(
        getOk(read(`(#%plain-lambda (x) (#%variable-reference x))`)) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(
      ok(
        sbox(
          make_fep_closure(
            undefined,
            ['x'],
            undefined,
            getOk(read('((#%variable-reference x))')) as SNonemptyHomList<ExprForm>
          )
        )
      )
    );

    expect(
      evaluate_expr_or_define(
        getOk(read(`(#%plain-lambda x (#%variable-reference x))`)) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(
      ok(
        sbox(
          make_fep_closure(
            undefined,
            [],
            'x',
            getOk(read('((#%variable-reference x))')) as SNonemptyHomList<ExprForm>
          )
        )
      )
    );

    expect(
      evaluate_expr_or_define(
        getOk(read(`(#%plain-lambda (x y) (#%variable-reference x))`)) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(
      ok(
        sbox(
          make_fep_closure(
            undefined,
            ['x', 'y'],
            undefined,
            getOk(read('((#%variable-reference x))')) as SNonemptyHomList<ExprForm>
          )
        )
      )
    );

    expect(
      evaluate_expr_or_define(
        getOk(read(`(#%plain-lambda (x y . z) (#%variable-reference x))`)) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(
      ok(
        sbox(
          make_fep_closure(
            undefined,
            ['x', 'y'],
            'z',
            getOk(read('((#%variable-reference x))')) as SNonemptyHomList<ExprForm>
          )
        )
      )
    );

    expect(
      evaluate_expr_or_define(
        getOk(
          read(
            `(#%plain-lambda (f x) (#%plain-app (#%variable-reference f) (#%variable-reference x)))`
          )
        ) as ExprOrDefineForm,
        undefined
      )
    ).toEqual(
      ok(
        sbox(
          make_fep_closure(
            undefined,
            ['f', 'x'],
            undefined,
            getOk(
              read('((#%plain-app (#%variable-reference f) (#%variable-reference x)))')
            ) as SNonemptyHomList<ExprForm>
          )
        )
      )
    );
  });

  test('evaluate #%plain-app', () => {
    const env = test_env();
    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(#%plain-app (#%plain-lambda (x) (#%variable-reference x)) (quote 1))`)
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snumber(1)));

    expect(
      evaluate_expr_or_define(
        getOk(
          read(`(#%plain-app (#%plain-lambda (x . y) (#%variable-reference y)) (quote 1))`)
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snil()));

    expect(
      evaluate_expr_or_define(
        getOk(
          read(
            `(#%plain-app (#%plain-lambda (x . y) (#%variable-reference y)) (quote 1) (quote 2))`
          )
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(slist([snumber(2)], snil())));

    expect(
      evaluate_expr_or_define(
        getOk(
          read(
            `(#%plain-app (#%plain-lambda (x . y) (#%variable-reference y)) (quote 1) (quote 2) (quote 3))`
          )
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(slist([snumber(2), snumber(3)], snil())));

    expect(
      evaluate_expr_or_define(
        getOk(
          read(
            `(#%plain-app (#%plain-lambda x (#%variable-reference x)) (quote 1) (quote 2) (quote 3))`
          )
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(slist([snumber(1), snumber(2), snumber(3)], snil())));

    expect(
      evaluate_expr_or_define(
        getOk(
          read(
            `(#%plain-app (#%plain-lambda 
                            (f x) 
                            (#%plain-app (#%variable-reference f) (#%variable-reference x))
                           )
                (#%plain-lambda (y) (#%variable-reference y))
                (quote 100))`
          )
        ) as ExprOrDefineForm,
        env
      )
    ).toEqual(ok(snumber(100)));
  });
});
