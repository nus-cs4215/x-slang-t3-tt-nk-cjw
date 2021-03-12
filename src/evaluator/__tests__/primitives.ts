import { JsonSExpr, jsonRead, jsonPrint } from '../../sexpr';
import { Environment, evaluate, the_global_environment } from '../../evaluator';
import { getOk, getErr } from '../../utils';

function expectJsonReadEvalPrint(j: JsonSExpr, env: Environment) {
  return expect(jsonPrint(getOk(evaluate(jsonRead(j), env))));
}

function expectJsonReadEvalError(j: JsonSExpr, env: Environment) {
  return expect(getErr(evaluate(jsonRead(j), env)));
}

describe('arithmetic primitives', () => {
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
    expectJsonReadEvalError(['+', 0, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['+', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['+', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
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
    expectJsonReadEvalError(['*', 0, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['*', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['*', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid -', () => {
    expectJsonReadEvalPrint(['-', 1], the_global_environment).toMatchInlineSnapshot(`-1`);
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
    expectJsonReadEvalError(['-', 0, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
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
    expectJsonReadEvalError(['/', 0, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['/', true], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['/', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });
});

describe('boolean ops', () => {
  test('valid =', () => {
    expectJsonReadEvalPrint(['=', 1, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['=', 1, 1, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['=', 0, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['=', 0, 1, 0], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['=', 0, 1, 1], the_global_environment).toMatchInlineSnapshot(`false`);
  });

  test('invalid =', () => {
    expectJsonReadEvalError(['='], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['=', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid <', () => {
    expectJsonReadEvalPrint(['<', 1, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['<', 1, 1, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['<', 0, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['<', 0, 1, 0], the_global_environment).toMatchInlineSnapshot(`false`);
  });

  test('invalid <', () => {
    expectJsonReadEvalError(['<'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['<', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid >', () => {
    expectJsonReadEvalPrint(['>', 1, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['>', 1, 1, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['>', 0, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['>', 0, 1, 0], the_global_environment).toMatchInlineSnapshot(`false`);
  });

  test('invalid >', () => {
    expectJsonReadEvalError(['>'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['>', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid <=', () => {
    expectJsonReadEvalPrint(['<=', 1, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['<=', 1, 1, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['<=', 0, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['<=', 0, 1, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['<=', 1, 0], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['<=', 1, 0, 0], the_global_environment).toMatchInlineSnapshot(`false`);
  });

  test('invalid <=', () => {
    expectJsonReadEvalError(['<='], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['<=', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid >=', () => {
    expectJsonReadEvalPrint(['>=', 1, 1], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['>=', 0, 1], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['>=', 1, 0], the_global_environment).toMatchInlineSnapshot(`true`);
  });

  test('invalid >=', () => {
    expectJsonReadEvalError(['>=', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid nan?', () => {
    expectJsonReadEvalPrint(['nan?', 0], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['nan?', 1 / 0], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['nan?', NaN], the_global_environment).toMatchInlineSnapshot(`true`);
  });

  test('invalid nan?', () => {
    expectJsonReadEvalError(['nan?', true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['nan?', 1, 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid infinite?', () => {
    expectJsonReadEvalPrint(['infinite?', 1 / 0], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(['infinite?', Infinity], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(['infinite?', 0], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['infinite?', NaN], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
  });

  test('invalid infinite?', () => {
    expectJsonReadEvalError(['infinite?', true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['infinite?', 1, 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid and', () => {
    expectJsonReadEvalPrint(['and'], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['and', true], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['and', false], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['and', true, true], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(['and', false, true], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(
      ['and', ['and', true], true],
      the_global_environment
    ).toMatchInlineSnapshot(`true`);
  });

  test('valid or', () => {
    expectJsonReadEvalPrint(['or'], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['or', true], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['or', false], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['or', true, true], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(['or', false, false], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(
      ['or', ['or', false], false],
      the_global_environment
    ).toMatchInlineSnapshot(`false`);
  });

  test('valid not', () => {
    expectJsonReadEvalPrint(['not', true], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['not', false], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['not', ['not', false]], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['not', 1], the_global_environment).toMatchInlineSnapshot(`false`);
  });

  test('invalid not', () => {
    expectJsonReadEvalError(['not'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['not', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['not', false, false], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('invalid not', () => {
    expectJsonReadEvalError(['not'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['not', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['not', false, false], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid xor', () => {
    expectJsonReadEvalPrint(['xor'], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['xor', true], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['xor', false], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['xor', true, true], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['xor', false, false], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(
      ['xor', ['or', false], false],
      the_global_environment
    ).toMatchInlineSnapshot(`false`);
  });

  test('invalid xor', () => {
    expectJsonReadEvalError(['xor', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
  });

  test('valid false?', () => {
    expectJsonReadEvalPrint(['false?', true], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['false?', false], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(
      ['false?', ['false?', false]],
      the_global_environment
    ).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['false?', 1], the_global_environment).toMatchInlineSnapshot(`false`);
  });

  test('invalid false?', () => {
    expectJsonReadEvalError(['false?'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['false?', false, false], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });
});
