import { JsonSExpr, jsonRead, jsonPrint } from '../../sexpr';
import { Environment, evaluate, the_global_environment } from '../../evaluator';
import { getOk, getErr } from '../../utils';

function expectJsonReadEvalPrint(j: JsonSExpr, env: Environment | undefined) {
  return expect(jsonPrint(getOk(evaluate(jsonRead(j), env))));
}

function expectJsonReadEvalError(j: JsonSExpr, env: Environment | undefined) {
  return expect(getErr(evaluate(jsonRead(j), env)));
}

describe('primitive function calls', () => {
  test('valid +', () => {
    expectJsonReadEvalPrint(['+'], the_global_environment).toMatchInlineSnapshot(`0`);
    expectJsonReadEvalPrint(['+', 1], the_global_environment).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['+', 1, 2], the_global_environment).toMatchInlineSnapshot(`3`);
    expectJsonReadEvalPrint(['+', 1, 2, 3], the_global_environment).toMatchInlineSnapshot(`6`);
    expectJsonReadEvalPrint(['+', 1, 2, 3, 4], the_global_environment).toMatchInlineSnapshot(`10`);
  });

  test('invalid +', () => {
    expectJsonReadEvalError(['+', '.', 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['+', 1, '.', 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['+', [1]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['+', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['+', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid -', () => {
    expectJsonReadEvalPrint(['-', 1], the_global_environment).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['-', 1, 2], the_global_environment).toMatchInlineSnapshot(`-1`);
    expectJsonReadEvalPrint(['-', 1, 2, 3], the_global_environment).toMatchInlineSnapshot(`-4`);
    expectJsonReadEvalPrint(['-', 1, 2, 3, 4], the_global_environment).toMatchInlineSnapshot(`-8`);
  });

  test('invalid -', () => {
    expectJsonReadEvalError(['-'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['-', '.', 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['-', 1, '.', 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['-', [1]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['-', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['-', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid *', () => {
    expectJsonReadEvalPrint(['*'], the_global_environment).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['*', 1], the_global_environment).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['*', 1, 2], the_global_environment).toMatchInlineSnapshot(`2`);
    expectJsonReadEvalPrint(['*', 1, 2, 3], the_global_environment).toMatchInlineSnapshot(`6`);
    expectJsonReadEvalPrint(['*', 1, 2, 3, 4], the_global_environment).toMatchInlineSnapshot(`24`);
  });

  test('invalid *', () => {
    expectJsonReadEvalError(['*', '.', 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['*', 1, '.', 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['*', [1]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['*', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['*', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid -', () => {
    expectJsonReadEvalPrint(['-', 1], the_global_environment).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['-', 1, 2], the_global_environment).toMatchInlineSnapshot(`-1`);
    expectJsonReadEvalPrint(['-', 1, 2, 3], the_global_environment).toMatchInlineSnapshot(`-4`);
    expectJsonReadEvalPrint(['-', 1, 2, 3, 4], the_global_environment).toMatchInlineSnapshot(`-8`);
  });

  test('invalid -', () => {
    expectJsonReadEvalError(['-'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['-', '.', 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['-', 1, '.', 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['-', [1]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['-', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['-', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid /', () => {
    expectJsonReadEvalPrint(['/', 1], the_global_environment).toMatchInlineSnapshot(`1`);
    expectJsonReadEvalPrint(['/', 1, 2], the_global_environment).toMatchInlineSnapshot(`0.5`);
    expectJsonReadEvalPrint(['/', 1, 2, 3], the_global_environment).toMatchInlineSnapshot(
      `0.16666666666666666`
    );
    expectJsonReadEvalPrint(['/', 1, 2, 3, 4], the_global_environment).toMatchInlineSnapshot(
      `0.041666666666666664`
    );
  });

  test('invalid /', () => {
    expectJsonReadEvalError(['/'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['/', '.', 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['/', 1, '.', 2], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['/', [1]], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['/', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['/', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });
});
