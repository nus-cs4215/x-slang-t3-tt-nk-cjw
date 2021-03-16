import { Environment, make_env, make_env_list } from '../../environment';
import { make_bindings_from_record, make_empty_bindings } from '../../environment';
import { primitives_module } from '../../modules';
import { JsonSExpr, jsonRead, jsonPrint } from '../../sexpr';
import { snumber, sboolean } from '../../sexpr';
import { ok, getOk, getErr } from '../../utils';
import { evaluate } from '../evaluator';

function expectJsonReadEvalPrint(j: JsonSExpr, env: Environment) {
  return expect(jsonPrint(getOk(evaluate(jsonRead(j), env))));
}

function expectJsonReadEvalError(j: JsonSExpr, env: Environment) {
  return expect(getErr(evaluate(jsonRead(j), env)));
}

const the_global_environment = primitives_module.env;

const test_env = () => make_env(make_empty_bindings(), the_global_environment);

test('evaluate values', () => {
  expect(evaluate(snumber(1), undefined)).toEqual(ok(snumber(1)));
  expect(evaluate(sboolean(true), undefined)).toEqual(ok(sboolean(true)));
});

describe('evaluate variables', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(
      'a',
      make_env_list(make_bindings_from_record({ a: snumber(1) }, {}))
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list(
        make_bindings_from_record({ a: snumber(1) }, {}),
        make_bindings_from_record({ a: snumber(2) }, {})
      )
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list(
        make_bindings_from_record({ b: snumber(3) }, {}),
        make_bindings_from_record({ a: snumber(1) }, {})
      )
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list(
        make_bindings_from_record({ a: snumber(1) }, {}),
        make_bindings_from_record({ b: snumber(3) }, {})
      )
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list(make_empty_bindings(), make_bindings_from_record({ a: snumber(1) }, {}))
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list(make_bindings_from_record({ a: snumber(1) }, {}), make_empty_bindings())
    ).toMatchInlineSnapshot(`1`);
  });

  test('invalid', () => {
    expectJsonReadEvalError('a', undefined).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError('a', make_env_list(make_empty_bindings())).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(
      'a',
      make_env_list(make_empty_bindings(), make_empty_bindings())
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      'a',
      make_env_list(make_bindings_from_record({ b: snumber(1) }, {}))
    ).toMatchInlineSnapshot(`undefined`);
  });
});

describe('quote special form', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['quote', 'a'], undefined).toMatchInlineSnapshot(`"a"`);
    expectJsonReadEvalPrint(['quote', 'b'], undefined).toMatchInlineSnapshot(`"b"`);
    expectJsonReadEvalPrint(['quote', 0], undefined).toMatchInlineSnapshot(`0`);
    expectJsonReadEvalPrint(['quote', 10], undefined).toMatchInlineSnapshot(`10`);
    expectJsonReadEvalPrint(['quote', []], undefined).toMatchInlineSnapshot(`Array []`);
    expectJsonReadEvalPrint(['quote', ['hey', 'there']], undefined).toMatchInlineSnapshot(`
          Array [
            "hey",
            "there",
          ]
      `);
    expectJsonReadEvalPrint(['quote', ['hey', 'there', '.', 'delilah']], undefined)
      .toMatchInlineSnapshot(`
          Array [
            "hey",
            "there",
            ".",
            "delilah",
          ]
      `);
  });

  test('invalid', () => {
    // too few args
    expectJsonReadEvalError(['quote'], undefined).toMatchInlineSnapshot(`undefined`);
    // too many args
    expectJsonReadEvalError(['quote', 'hey', 'there'], undefined).toMatchInlineSnapshot(
      `undefined`
    );
    // improper list
    expectJsonReadEvalError(['quote', '.', 'a'], undefined).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['quote', 'a', '.', 'b'], undefined).toMatchInlineSnapshot(`undefined`);
  });
});

describe('quasiquote special form', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['quasiquote', 'a'], undefined).toMatchInlineSnapshot(`"a"`);
    expectJsonReadEvalPrint(['quasiquote', 'b'], undefined).toMatchInlineSnapshot(`"b"`);
    expectJsonReadEvalPrint(['quasiquote', 0], undefined).toMatchInlineSnapshot(`0`);
    expectJsonReadEvalPrint(['quasiquote', 10], undefined).toMatchInlineSnapshot(`10`);
    expectJsonReadEvalPrint(['quasiquote', []], undefined).toMatchInlineSnapshot(`Array []`);
    expectJsonReadEvalPrint(['quasiquote', ['hey', 'there']], undefined).toMatchInlineSnapshot(`
          Array [
            "hey",
            "there",
          ]
      `);
    expectJsonReadEvalPrint(['quasiquote', ['hey', 'there', '.', 'delilah']], undefined)
      .toMatchInlineSnapshot(`
          Array [
            "hey",
            "there",
            ".",
            "delilah",
          ]
      `);

    expectJsonReadEvalPrint(['quasiquote', ['unquote', 1]], test_env()).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      ['quasiquote', ['unquote', ['+', 1, 2]]],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      ['quasiquote', ['abc', ['unquote', ['+', 1, 2]], ['unquote', ['+', 2, 3]]]],
      test_env()
    ).toMatchInlineSnapshot(`
      Array [
        "abc",
        3,
        5,
      ]
    `);

    // nested quasiquotes ;')
    expectJsonReadEvalPrint(
      [
        'quasiquote',
        [
          'abc',
          ['unquote', ['list', ['+', 1, 2], ['quasiquote', ['def', ['unquote', ['+', 2, 3]]]]]],
        ],
      ],
      test_env()
    ).toMatchInlineSnapshot(`
      Array [
        "abc",
        Array [
          3,
          Array [
            "def",
            5,
          ],
        ],
      ]
    `);
  });

  test('invalid', () => {
    // too few args
    expectJsonReadEvalError(['quasiquote'], test_env()).toMatchInlineSnapshot(`undefined`);
    // too many args
    expectJsonReadEvalError(['quasiquote', 'hey', 'there'], test_env()).toMatchInlineSnapshot(
      `undefined`
    );
    // improper list
    expectJsonReadEvalError(['quasiquote', '.', 'a'], test_env()).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['quasiquote', 'a', '.', 'b'], test_env()).toMatchInlineSnapshot(
      `undefined`
    );

    // error in unquote
    expectJsonReadEvalError(
      ['quasiquote', ['unquote', 'hey', 'there']],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['quasiquote', ['unquote']], test_env()).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(
      ['quasiquote', ['unquote', '.', 'a']],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      ['quasiquote', ['unquote', 'a', '.', 'b']],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['quasiquote', ['unquote', []]], test_env()).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['quasiquote', ['abc', ['unquote']]], test_env()).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['quasiquote', [['unquote'], 'abc']], test_env()).toMatchInlineSnapshot(
      `undefined`
    );

    // unquote without quasiquote
    expectJsonReadEvalError(['unquote', 1], test_env()).toMatchInlineSnapshot(`undefined`);
  });
});

describe('basic function calls', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['+', 1, 2], test_env()).toMatchInlineSnapshot(`3`);
    expectJsonReadEvalPrint(['+', 1, 2, ['+', 3, 4]], test_env()).toMatchInlineSnapshot(`10`);
    expectJsonReadEvalPrint(['*', ['+', 2, 3], ['+', 2, 3]], test_env()).toMatchInlineSnapshot(
      `25`
    );
  });

  test('invalid', () => {
    expectJsonReadEvalError([], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([1], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([1, 2], test_env()).toMatchInlineSnapshot(`undefined`);

    expectJsonReadEvalError(['+', []], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['+', [1]], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([[]], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([[1]], test_env()).toMatchInlineSnapshot(`undefined`);

    // Fancy stuff that dig into internals...
    expectJsonReadEvalError([['quote', []], 1, 2], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([['quote', [1]], 1, 2], test_env()).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['invalid function type']], 1, 2],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['primitive_function']], 1, 2],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['primitive_function', 1]], 1, 2],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['primitive_function', 'nonexistent primitive function name']], 1, 2],
      test_env()
    ).toMatchInlineSnapshot(`undefined`);
  });
});

describe('basic let blocks', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['let', [['a', ['+', 1, 2]]], 'a'], test_env()).toMatchInlineSnapshot(
      `3`
    );

    expectJsonReadEvalPrint(
      ['let', [['a', ['+', 1, 2]]], ['+', 'a', 1], 'a'],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      [
        'let',
        [
          ['a', ['+', 1, 2]],
          ['b', 3],
        ],
        ['+', 'a', 'b'],
      ],
      test_env()
    ).toMatchInlineSnapshot(`6`);

    expectJsonReadEvalPrint(
      [
        'let',
        [
          ['a', ['+', 1, 2]],
          ['b', 3],
        ],
        'b',
      ],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      ['let', [['a', ['+', 1, 2]]], ['let', [['a', 0]], 'a']],
      test_env()
    ).toMatchInlineSnapshot(`0`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(['let', [[1, ['+', 1, 2]]], 1], test_env());

    expectJsonReadEvalError(['let', [['a', []]], 'a'], test_env());

    expectJsonReadEvalError(['let', [['a', 1]], [], 'a'], test_env());

    expectJsonReadEvalError(
      [
        'let',
        [
          ['a', 1],
          ['b', 'a'],
        ],
        'b',
      ],
      test_env()
    );
  });
});

describe('basic let* blocks', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(
      [
        'let*',
        [
          ['a', 1],
          ['b', 'a'],
        ],
        'b',
      ],
      test_env()
    ).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      [
        'let*',
        [
          ['a', 1],
          ['b', 'a'],
        ],
        'a',
        'b',
      ],
      test_env()
    ).toMatchInlineSnapshot(`1`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(
      [
        'let*',
        [
          ['a', 1],
          [2, 'a'],
        ],
        2,
      ],
      test_env()
    );

    expectJsonReadEvalError(
      [
        'let*',
        [
          ['a', 1],
          ['b', []],
        ],
        'a',
      ],
      test_env()
    );

    expectJsonReadEvalError(
      [
        'let*',
        [
          ['a', 1],
          ['b', 'a'],
        ],
        ['a'],
        'a',
      ],
      test_env()
    );
  });
});

describe('basic letrec blocks', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(
      [
        'letrec',
        [
          ['a', ['lambda', [], 'b']],
          ['b', 1],
        ],
        ['a'],
      ],
      test_env()
    ).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      [
        'letrec',
        [
          ['a', ['lambda', [], 'b']],
          ['b', 1],
        ],
        ['a'],
        'b',
      ],
      test_env()
    ).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      [
        'letrec',
        [
          ['a', 1],
          ['b', 'a'],
        ],
        'a',
        'b',
      ],
      test_env()
    ).toMatchInlineSnapshot(`1`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(
      [
        'letrec',
        [
          ['a', 'b'],
          ['b', 1],
        ],
        'a',
      ],
      test_env()
    );

    expectJsonReadEvalError(
      [
        'letrec',
        [
          ['a', ['lambda', [], 'b']],
          ['b', 1],
        ],
        [],
        ['a'],
      ],
      test_env()
    );

    expectJsonReadEvalError(
      [
        'letrec',
        [
          [1, ['lambda', [], 'b']],
          ['b', 1],
        ],
        ['a'],
      ],
      test_env()
    );

    expectJsonReadEvalError(
      [
        'letrec',
        [
          ['a', ['lambda', [], 'b']],
          ['b', [1]],
        ],
        ['a'],
      ],
      test_env()
    );
  });
});

describe('basic lambda expressions', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['lambda', ['x'], ['+', 1]], test_env());

    expectJsonReadEvalPrint(['lambda', [], 1], test_env());

    expectJsonReadEvalPrint([['lambda', [], 1]], test_env()).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      [['lambda', ['x'], ['+', 'x', 1]], 1],
      test_env()
    ).toMatchInlineSnapshot(`2`);

    expectJsonReadEvalPrint(
      [['lambda', ['x', 'y'], ['+', 'x', 'y']], 1, 2],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      [['lambda', ['x', 'y'], 'x', 'y', ['+', 'x', 'y']], 1, 2],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      [
        ['lambda', ['plus-one'], ['plus-one', 0]],
        ['lambda', ['x'], ['+', 'x', 1]],
      ],
      test_env()
    ).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      [
        ['lambda', ['plus-one', 'thrice'], [['thrice', 'plus-one'], 0]],
        ['lambda', ['x'], ['+', 'x', 1]],
        ['lambda', ['f'], ['lambda', ['x'], ['f', ['f', ['f', 'x']]]]],
      ],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      [
        ['lambda', ['plus-one', 'thrice'], [['thrice', ['thrice', 'plus-one']], 0]],
        ['lambda', ['x'], ['+', 'x', 1]],
        ['lambda', ['f'], ['lambda', ['x'], ['f', ['f', ['f', 'x']]]]],
      ],
      test_env()
    ).toMatchInlineSnapshot(`9`);

    expectJsonReadEvalPrint(
      [
        ['lambda', ['plus-one', 'thrice'], [[['thrice', 'thrice'], 'plus-one'], 0]],
        ['lambda', ['x'], ['+', 'x', 1]],
        ['lambda', ['f'], ['lambda', ['x'], ['f', ['f', ['f', 'x']]]]],
      ],
      test_env()
    ).toMatchInlineSnapshot(`27`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(['lambda', 'x', ['+', 1]], test_env());
    expectJsonReadEvalError(['lambda', [1], ['+', 1]], test_env());
    expectJsonReadEvalError([['lambda', ['x'], ['+', 'x', 'x']], 1, 2], test_env());
    expectJsonReadEvalError([['lambda', ['f'], ['f', 1]], 1], test_env());
    expectJsonReadEvalError([['lambda', ['f'], ['f', 1], 'f'], 1], test_env());
  });
});

describe('basic and expressions', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['and', true, true], test_env()).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['and', false, true], test_env()).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['and'], test_env()).toMatchInlineSnapshot(`true`);
    // expectJsonReadEvalPrint(['and', false, err()], test_env()).toMatchInlineSnapshot(`false`);
  });
});

describe('basic cond expressions', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['cond', [true, 1]], test_env()).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(['cond', [true, 1], [true, 2]], test_env()).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(['cond', [false, 1], [true, 2]], test_env()).toMatchInlineSnapshot(`2`);

    expectJsonReadEvalPrint(['cond', [true, 1, 2], [true, 3]], test_env()).toMatchInlineSnapshot(
      `2`
    );

    expectJsonReadEvalPrint(['cond', [false], [true], [true, 1]], test_env()).toMatchInlineSnapshot(
      `true`
    );

    expectJsonReadEvalPrint(
      ['cond', [false], [false], [true, 1]],
      test_env()
    ).toMatchInlineSnapshot(`1`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(['cond', [[], 1]], test_env()).toMatchInlineSnapshot(`undefined`);

    expectJsonReadEvalError(['cond', [true, '.', 1]], test_env()).toMatchInlineSnapshot(
      `undefined`
    );

    expectJsonReadEvalError(['cond', [true, []]], test_env()).toMatchInlineSnapshot(`undefined`);

    expectJsonReadEvalError(['cond', [true, [], 1]], test_env()).toMatchInlineSnapshot(`undefined`);

    expectJsonReadEvalError(['cond'], test_env()).toMatchInlineSnapshot(`undefined`);

    expectJsonReadEvalError(['cond', [false]], test_env()).toMatchInlineSnapshot(`undefined`);
  });
});

describe('basic begin expressions', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['begin', 1], test_env()).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['begin', 1, 2], test_env()).toMatchInlineSnapshot(`2`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(['begin', [1]], test_env());
    expectJsonReadEvalError(['begin', [1], 2], test_env());
    expectJsonReadEvalError(['begin', 1, [2]], test_env());
    expectJsonReadEvalError(['begin', [1], 2, 3], test_env());
    expectJsonReadEvalError(['begin', 1, [2], 3], test_env());
    expectJsonReadEvalError(['begin', 1, 2, [3]], test_env());
  });
});

describe('basic begin0 expressions', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['begin0', 1], test_env()).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['begin0', 1, 2], test_env()).toMatchInlineSnapshot(`1`);
  });

  test('invalid', () => {
    expectJsonReadEvalError(['begin0', [1]], test_env());
    expectJsonReadEvalError(['begin0', [1], 2], test_env());
    expectJsonReadEvalError(['begin0', 1, [2]], test_env());
    expectJsonReadEvalError(['begin0', [1], 2, 3], test_env());
    expectJsonReadEvalError(['begin0', 1, [2], 3], test_env());
    expectJsonReadEvalError(['begin0', 1, 2, [3]], test_env());
  });
});

describe('basic define constant', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['begin', ['define', 'a', 1]], test_env()).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(['begin', ['define', 'a', 1], 'a'], test_env()).toMatchInlineSnapshot(
      `1`
    );
  });

  test('invalid', () => {
    expectJsonReadEvalError(['begin', ['define', 'a']], test_env());

    expectJsonReadEvalError(['begin', ['define', 1]], test_env());

    expectJsonReadEvalError(['begin', ['define', 1, 1]], test_env());

    expectJsonReadEvalError(['begin', ['define', 'a', []]], test_env());

    expectJsonReadEvalError(['begin', 'nonexistent', ['define', 'nonexistent', 1]], test_env());
  });
});

describe('basic define function', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['begin', ['define', ['f'], 1]], test_env()).toHaveProperty('boxed');
    expectJsonReadEvalPrint(['begin', ['define', ['f'], 1], 'f'], test_env()).toHaveProperty(
      'boxed'
    );

    expectJsonReadEvalPrint(
      ['begin', ['define', ['f'], 1], ['f']],
      test_env()
    ).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      ['begin', ['define', ['f'], 1, 2], ['f']],
      test_env()
    ).toMatchInlineSnapshot(`2`);

    expectJsonReadEvalPrint(['begin', ['define', ['f', 'x'], 'x']], test_env()).toHaveProperty(
      'boxed'
    );

    expectJsonReadEvalPrint(['begin', ['define', ['f', 'x'], 'x'], 'f'], test_env()).toHaveProperty(
      'boxed'
    );

    expectJsonReadEvalPrint(
      ['begin', ['define', ['f', 'x'], 'x'], ['f', 1]],
      test_env()
    ).toMatchInlineSnapshot(`1`);

    expectJsonReadEvalPrint(
      ['begin', ['define', ['f', 'x', 'y'], ['+', 'x', 'y']], ['f', 1, 2]],
      test_env()
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      ['begin', ['define', ['f', 'x'], ['define', 'x1', ['+', 'x', 1]], 'x1'], ['f', 1]],
      test_env()
    ).toMatchInlineSnapshot(`2`);

    expectJsonReadEvalPrint(['begin', ['define', ['f'], []], 'f'], test_env()).toHaveProperty(
      'boxed'
    );
  });

  test('invalid', () => {
    expectJsonReadEvalError(['begin', ['define', [], 1]], test_env());

    expectJsonReadEvalError(['begin', ['define', [1], 1]], test_env());

    expectJsonReadEvalError(['begin', ['define', ['f', 1], 1]], test_env());

    expectJsonReadEvalError(['begin', ['define', ['f']]], test_env());

    expectJsonReadEvalError(['begin', ['define', ['f'], []], ['f']], test_env());
  });
});
