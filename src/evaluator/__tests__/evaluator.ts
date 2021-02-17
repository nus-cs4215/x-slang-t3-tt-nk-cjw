import { JsonSExpr, jsonsexprToSexpr, sexprToJsonsexpr } from '../../sexpr';
import { snumber, sboolean } from '../../sexpr';
import { Environment, evaluate, make_env_list } from '../evaluator';
import { ok, getOk, getErr } from '../../utils';

function expectJsonReadEvalPrint(j: JsonSExpr, env: Environment | undefined) {
  return expect(sexprToJsonsexpr(getOk(evaluate(jsonsexprToSexpr(j), env))));
}

function expectJsonReadEvalError(j: JsonSExpr, env: Environment | undefined) {
  return expect(getErr(evaluate(jsonsexprToSexpr(j), env)));
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
