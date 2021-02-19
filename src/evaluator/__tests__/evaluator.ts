import { JsonSExpr, jsonRead, jsonPrint } from '../../sexpr';
import { snumber, sboolean } from '../../sexpr';
import { Environment, evaluate, make_env_list, the_global_environment } from '../evaluator';
import { ok, getOk, getErr } from '../../utils';

function expectJsonReadEvalPrint(j: JsonSExpr<never>, env: Environment | undefined) {
  return expect(jsonPrint(getOk(evaluate(jsonRead(j), env))));
}

function expectJsonReadEvalError(j: JsonSExpr<never>, env: Environment | undefined) {
  return expect(getErr(evaluate(jsonRead(j), env)));
}

test('evaluate values', () => {
  expect(evaluate(snumber(1), undefined)).toEqual(ok(snumber(1)));
  expect(evaluate(sboolean(true), undefined)).toEqual(ok(sboolean(true)));
});

describe('evaluate variables', () => {
  test('valid', () => {
    expectJsonReadEvalPrint('a', make_env_list({ a: snumber(1) })).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list({ a: snumber(1) }, { a: snumber(2) })
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list({ b: snumber(3) }, { a: snumber(1) })
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(
      'a',
      make_env_list({ a: snumber(1) }, { b: snumber(3) })
    ).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint('a', make_env_list({}, { a: snumber(1) })).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint('a', make_env_list({ a: snumber(1) }, {})).toMatchInlineSnapshot(`1`);
  });

  test('invalid', () => {
    expectJsonReadEvalError('a', undefined).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError('a', make_env_list({})).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError('a', make_env_list({}, {})).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError('a', make_env_list({ b: snumber(1) })).toMatchInlineSnapshot(
      `undefined`
    );
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

describe('basic function calls', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['+', 1, 2], the_global_environment).toMatchInlineSnapshot(`3`);
    expectJsonReadEvalPrint(['+', 1, 2, ['+', 3, 4]], the_global_environment).toMatchInlineSnapshot(
      `10`
    );
    expectJsonReadEvalPrint(
      ['*', ['+', 2, 3], ['+', 2, 3]],
      the_global_environment
    ).toMatchInlineSnapshot(`25`);
  });

  test("probably shouldn't be valid but uh...", () => {
    expectJsonReadEvalPrint(
      [['quote', ['primitive_function', '+']], 1, 2],
      the_global_environment
    ).toMatchInlineSnapshot(`3`);
  });

  test('invalid', () => {
    expectJsonReadEvalError([], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([1], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([1, 2], the_global_environment).toMatchInlineSnapshot(`undefined`);

    expectJsonReadEvalError(['+', []], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['+', [1]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([[]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError([[1]], the_global_environment).toMatchInlineSnapshot(`undefined`);

    // Fancy stuff that dig into internals...
    expectJsonReadEvalError([['quote', []], 1, 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError([['quote', [1]], 1, 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(
      [['quote', ['invalid function type']], 1, 2],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['primitive_function']], 1, 2],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['primitive_function', 1]], 1, 2],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      [['quote', ['primitive_function', 'nonexistent primitive function name']], 1, 2],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
  });
});

describe('basic let blocks', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(
      ['let', [['a', ['+', 1, 2]]], 'a'],
      the_global_environment
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      ['let', [['a', ['+', 1, 2]]], ['+', 'a', 1], 'a'],
      the_global_environment
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
      the_global_environment
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
      the_global_environment
    ).toMatchInlineSnapshot(`3`);

    expectJsonReadEvalPrint(
      ['let', [['a', ['+', 1, 2]]], ['let', [['a', 0]], 'a']],
      the_global_environment
    ).toMatchInlineSnapshot(`0`);
  });
});
