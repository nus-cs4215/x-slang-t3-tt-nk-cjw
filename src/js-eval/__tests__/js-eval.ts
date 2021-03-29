import { builtin_compiler_host } from '../../compiler/compiler-base';
import { make_empty_bindings, make_env_list, set_define } from '../../environment';
import { ExprOrDefineForm } from '../../fep-types';
import { print } from '../../printer';
import { read } from '../../reader';
import { getOk } from '../../utils';
import {
  compile_expr_or_define_to_js_expr,
  compile_js_expr_to_evalable,
  compile_module_to_js_expr,
  js_transpile_run_module,
  eval_js_expr_in_env,
} from '../js-eval';

test('compile expr or define', () => {
  expect(
    compile_expr_or_define_to_js_expr(getOk(read('(quote 1)')) as ExprOrDefineForm)
  ).toMatchInlineSnapshot(`"read(\`1\`)"`);

  expect(
    compile_expr_or_define_to_js_expr(
      getOk(read('(begin (quote 1) (quote 2))')) as ExprOrDefineForm
    )
  ).toMatchInlineSnapshot(`
    "begin(read(\`1\`),
    read(\`2\`))"
  `);

  expect(
    compile_expr_or_define_to_js_expr(getOk(read('(define x (quote 1))')) as ExprOrDefineForm)
  ).toMatchInlineSnapshot(
    `"begin0(variable_x_ = read(\`1\`), exports.set(\`x\`, [0, variable_x_]))"`
  );

  expect(
    compile_expr_or_define_to_js_expr(
      getOk(read('(#%plain-lambda (x) (#%variable-reference x))')) as ExprOrDefineForm
    )
  ).toMatchInlineSnapshot(`
    "({ _type: 5, val: { variant: 2, fun: (variable_x_, ...extra) => {
    const exports = { set: (x) => x };
    if (variable_x_ === undefined) { return ({ good: false, v: undefined, err: 'too few arguments given' }); }
    if (extra.length > 0) { return ({ good: false, v: undefined, err: 'too many arguments given' }); }
    let result = undefined;
    result = variable_x_;
    return ({ good: true, v: result, err: undefined });
    } } })"
  `);

  expect(
    compile_expr_or_define_to_js_expr(
      getOk(
        read(`
          (#%plain-lambda (x)
            (define y (#%variable-reference x))
            (#%variable-reference y))
          `)
      ) as ExprOrDefineForm
    )
  ).toMatchInlineSnapshot(`
    "({ _type: 5, val: { variant: 2, fun: (variable_x_, ...extra) => {
    const exports = { set: (x) => x };
    if (variable_x_ === undefined) { return ({ good: false, v: undefined, err: 'too few arguments given' }); }
    if (extra.length > 0) { return ({ good: false, v: undefined, err: 'too many arguments given' }); }
    let variable_y_ = undefined;
    let binding_type_y_ = 0;
    let result = undefined;
    result = begin0(variable_y_ = variable_x_, exports.set(\`y\`, [0, variable_y_]));
    result = variable_y_;
    return ({ good: true, v: result, err: undefined });
    } } })"
  `);

  expect(
    compile_expr_or_define_to_js_expr(
      getOk(read('(#%plain-app (#%variable-reference +) (quote 1) (quote 2))')) as ExprOrDefineForm
    )
  ).toMatchInlineSnapshot(`"apply(variable__, read(\`1\`), read(\`2\`))"`);

  expect(
    compile_expr_or_define_to_js_expr(
      getOk(
        read(
          '(#%plain-app (#%plain-lambda (x) (define y (#%variable-reference x)) (#%variable-reference y)) (quote 1))'
        )
      ) as ExprOrDefineForm
    )
  ).toMatchInlineSnapshot(`
    "apply(({ _type: 5, val: { variant: 2, fun: (variable_x_, ...extra) => {
    const exports = { set: (x) => x };
    if (variable_x_ === undefined) { return ({ good: false, v: undefined, err: 'too few arguments given' }); }
    if (extra.length > 0) { return ({ good: false, v: undefined, err: 'too many arguments given' }); }
    let variable_y_ = undefined;
    let binding_type_y_ = 0;
    let result = undefined;
    result = begin0(variable_y_ = variable_x_, exports.set(\`y\`, [0, variable_y_]));
    result = variable_y_;
    return ({ good: true, v: result, err: undefined });
    } } }), read(\`1\`))"
  `);
});

test('compile and run expr or define', () => {
  const test_env = () =>
    make_env_list(getOk(builtin_compiler_host().read_builtin_module('#%builtin-kernel')).provides);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(getOk(read('(quote 1)')) as ExprOrDefineForm),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"1"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(read('(begin (quote 1) (quote 2))')) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"2"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(read('(define x (quote 1))')) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"1"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(read('(#%plain-lambda (x) (#%variable-reference x))')) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"#boxed"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(
              read(
                '(#%plain-lambda (x) (define y (#%variable-reference x)) (#%variable-reference y))'
              )
            ) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"#boxed"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(
              read('(#%plain-app (#%variable-reference +) (quote 1) (quote 2))')
            ) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"3"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(
              read(
                '(#%plain-app (#%plain-lambda (x) (define y (#%variable-reference x)) (#%variable-reference y)) (quote 1))'
              )
            ) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"1"`);

  expect(
    print(
      getOk(
        eval_js_expr_in_env(
          compile_expr_or_define_to_js_expr(
            getOk(
              read(`
                (#%plain-app (#%plain-lambda ()
                  (define y (quote 1))
                  (#%plain-app
                    (#%plain-lambda (x)
                      (define y (#%variable-reference x))
                      (#%variable-reference y)
                      )
                    (quote 2)
                    )
                  (#%variable-reference y)
                  ))
                `)
            ) as ExprOrDefineForm
          ),
          test_env()
        )
      )
    )
  ).toMatchInlineSnapshot(`"1"`);
});

test('compile and run modules (assuming requires alr handled)', () => {
  const test_env = () =>
    make_env_list(
      make_empty_bindings(),
      getOk(builtin_compiler_host().read_builtin_module('#%builtin-kernel')).provides
    );
  const env = test_env();
  set_define(env.bindings, 'abc', getOk(read('123')));

  expect(
    getOk(
      eval_js_expr_in_env(
        compile_module_to_js_expr(
          `
          (module input '#%builtin-kernel
            (#%plain-module-begin
              (#%require some-module-that-provides-abc)
              (define xyz (quote 789))
              (#%provide abc xyz)
              )
            )
          `,
          '/input.rkt'
        )[1],
        env
      )
    )
  ).toMatchInlineSnapshot(`
    Object {
      "filename": "/input.rkt",
      "name": "input",
      "provides": Map {
        "abc" => Object {
          "_type": 0,
          "val": Object {
            "_type": 1,
            "val": 123,
          },
        },
        "xyz" => Object {
          "_type": 0,
          "val": Object {
            "_type": 1,
            "val": 789,
          },
        },
      },
    }
  `);
});

test('compile and run modules', () => {
  expect(
    js_transpile_run_module(
      `
      (module input '#%builtin-kernel
        (#%plain-module-begin
          (define xyz (#%plain-app (#%variable-reference +) (quote 123) (quote 789)))
          (#%provide xyz)
          )
        )
      `,
      '/input.rkt',
      builtin_compiler_host()
    )
  ).toMatchInlineSnapshot(`
    Object {
      "err": undefined,
      "good": true,
      "v": Object {
        "filename": "/input.rkt",
        "name": "input",
        "provides": Map {
          "xyz" => Object {
            "_type": 0,
            "val": Object {
              "_type": 1,
              "val": 912,
            },
          },
        },
      },
    }
  `);
});

test('demo how transpiled expr/defines looks like', () => {
  const test_env = () =>
    make_env_list(getOk(builtin_compiler_host().read_builtin_module('#%builtin-kernel')).provides);

  const bindings_and_evalable = compile_js_expr_to_evalable(
    compile_expr_or_define_to_js_expr(
      getOk(
        read(`
          (set! pi (quote 1))
          `)
      ) as ExprOrDefineForm
    ),
    test_env()
  );

  expect(['bindings omitted...', bindings_and_evalable[1]]).toMatchInlineSnapshot(`
    Array [
      "bindings omitted...",
      "
        function assertDefined(v) {
          if (v === undefined) {
            throw 'tried to use undefined value';
            } else {
            return v;
          }
        }

        function array_to_list(arr) {
          let result = { _type: 3 }; // nil
          for (let i = arr.length - 1; i >= 0; i--) {
            result = { _type: 4, x: arr[i], y: result };
          }
          return result;
        }

        function is_not_false(sexpr) {
          return sexpr._type !== 2 || sexpr.val !== false;
        }

        function begin(...args) {
          return args[args.length - 1];
        }
        function begin0(...args) {
          return args[0];
        }
        function evaler(
            apply,
            read,
            variable_pi_,
            variable__,
            variable_x_,
            binding_type_pi_,
            binding_type__,
            binding_type_x_
    ) {
    const exports = new Map();










    const result = (variable_pi_ = read(\`1\`));










    const new_values = new Map();
    new_values.set(\`pi\`, variable_pi_);
    new_values.set(\`+\`, variable__);
    new_values.set(\`x\`, variable_x_);
    return [exports, new_values, result];}
    return evaler;",
    ]
  `);
});

test('demo how transpiled modules look like', () => {
  const test_env = () =>
    make_env_list(getOk(builtin_compiler_host().read_builtin_module('#%builtin-kernel')).provides);

  const bindings_and_evalable = compile_js_expr_to_evalable(
    compile_module_to_js_expr(
      `
      (module input '#%kernel
        (#%plain-module-begin
          (#%require some-module-that-provides-abc)
          (define y (quote 1))
          (#%plain-app
            (#%plain-lambda (x)
              (define y (#%variable-reference x))
              (#%variable-reference y)
              )
            (quote 2)
            )
          (#%provide y)
          (#%provide (rename y z))
          )
        )
      `,
      '/input.rkt'
    )[1],
    test_env()
  );

  expect(['bindings omitted...', bindings_and_evalable[1]]).toMatchInlineSnapshot(`
    Array [
      "bindings omitted...",
      "
        function assertDefined(v) {
          if (v === undefined) {
            throw 'tried to use undefined value';
            } else {
            return v;
          }
        }

        function array_to_list(arr) {
          let result = { _type: 3 }; // nil
          for (let i = arr.length - 1; i >= 0; i--) {
            result = { _type: 4, x: arr[i], y: result };
          }
          return result;
        }

        function is_not_false(sexpr) {
          return sexpr._type !== 2 || sexpr.val !== false;
        }

        function begin(...args) {
          return args[args.length - 1];
        }
        function begin0(...args) {
          return args[0];
        }
        function evaler(
            apply,
            read,
            variable_pi_,
            variable__,
            variable_x_,
            binding_type_pi_,
            binding_type__,
            binding_type_x_
    ) {
    const exports = new Map();










    const result = (() => {
    const exports = new Map();
    let variable_y_ = undefined;
    let binding_type_y_ = 0;
    begin0(variable_y_ = read(\`1\`), exports.set(\`y\`, [0, variable_y_]));

    apply(({ _type: 5, val: { variant: 2, fun: (variable_x_, ...extra) => {
    const exports = { set: (x) => x };
    if (variable_x_ === undefined) { return ({ good: false, v: undefined, err: 'too few arguments given' }); }
    if (extra.length > 0) { return ({ good: false, v: undefined, err: 'too many arguments given' }); }
    let variable_y_ = undefined;
    let binding_type_y_ = 0;
    let result = undefined;
    result = begin0(variable_y_ = variable_x_, exports.set(\`y\`, [0, variable_y_]));
    result = variable_y_;
    return ({ good: true, v: result, err: undefined });
    } } }), read(\`2\`));

    const provides = new Map();

          {
            const binding_value = variable_y_;
            if (binding_value === undefined) {
              throw \`tried to provide y but it was not defined\`;
            }
            const binding_type = binding_type_y_;
            if (binding_type !== 2) {
              provides.set(\`y\`, { _type: binding_type, val: binding_value });
            } else {
              provides.set(\`y\`, { _type: binding_type, fun: binding_value });
            }
          }
          {
            const binding_value = variable_y_;
            if (binding_value === undefined) {
              throw \`tried to provide y but it was not defined\`;
            }
            const binding_type = binding_type_y_;
            if (binding_type !== 2) {
              provides.set(\`z\`, { _type: binding_type, val: binding_value });
            } else {
              provides.set(\`z\`, { _type: binding_type, fun: binding_value });
            }
          }

    const output_module = { name: \`input\`, filename: \`/input.rkt\`, provides: provides };
    return output_module;
    })();










    const new_values = new Map();
    new_values.set(\`pi\`, variable_pi_);
    new_values.set(\`+\`, variable__);
    new_values.set(\`x\`, variable_x_);
    return [exports, new_values, result];}
    return evaler;",
    ]
  `);
});
