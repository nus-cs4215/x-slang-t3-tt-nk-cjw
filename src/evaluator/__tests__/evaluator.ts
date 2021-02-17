import { JsonSExpr, jsonsexprToSexpr, sexprToJsonsexpr } from '../../sexpr';
import { evaluate } from '../evaluator';
import { ok, getOk, getErr } from '../../utils';

function expectJsonReadEvalPrint(j: JsonSExpr) {
  return expect(sexprToJsonsexpr(getOk(evaluate(jsonsexprToSexpr(j)))));
}

function expectJsonReadEvalError(j: JsonSExpr) {
  return expect(getErr(evaluate(jsonsexprToSexpr(j))));
}

test('Normal form value equality', () => {
  expect(evaluate(jsonsexprToSexpr(1))).toEqual(ok(jsonsexprToSexpr(1)));
  expect(evaluate(jsonsexprToSexpr(true))).toEqual(ok(jsonsexprToSexpr(true)));
  expect(evaluate(jsonsexprToSexpr([]))).toEqual(ok(jsonsexprToSexpr([])));
});

describe('quote special form', () => {
  test('valid', () => {
    expectJsonReadEvalPrint(['quote', 'a']).toMatchInlineSnapshot(`"a"`);
    expectJsonReadEvalPrint(['quote', 'b']).toMatchInlineSnapshot(`"b"`);
    expectJsonReadEvalPrint(['quote', 0]).toMatchInlineSnapshot(`0`);
    expectJsonReadEvalPrint(['quote', 10]).toMatchInlineSnapshot(`10`);
    expectJsonReadEvalPrint(['quote', []]).toMatchInlineSnapshot(`Array []`);
    expectJsonReadEvalPrint(['quote', ['hey', 'there']]).toMatchInlineSnapshot(`
          Array [
            "hey",
            "there",
          ]
      `);
    expectJsonReadEvalPrint(['quote', ['hey', 'there', '.', 'delilah']]).toMatchInlineSnapshot(`
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
    expectJsonReadEvalError(['quote']).toMatchInlineSnapshot(`undefined`);
    // too many args
    expectJsonReadEvalError(['quote', 'hey', 'there']).toMatchInlineSnapshot(`undefined`);
    // improper list
    expectJsonReadEvalError(['quote', '.', 'a']).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['quote', 'a', '.', 'b']).toMatchInlineSnapshot(`undefined`);
  });
});
