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

describe('list accessor primitives', () => {
  test('valid car', () => {
    expectJsonReadEvalPrint(
      ['car', ['quote', ['a']]],
      the_global_environment
    ).toMatchInlineSnapshot(`"a"`);
  });

  test('invalid car', () => {
    expectJsonReadEvalError(['car', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['car', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['car', true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['car', []], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['car'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      ['car', ['quote', 'a'], ['quote', 'a']],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
  });

  test('valid cdr', () => {
    expectJsonReadEvalPrint(
      ['cdr', ['quote', ['a']]],
      the_global_environment
    ).toMatchInlineSnapshot(`Array []`);
  });

  test('invalid cdr', () => {
    expectJsonReadEvalError(['cdr', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['cdr', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['cdr', true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['cdr', []], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['cdr'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      ['cdr', ['quote', 'a'], ['quote', 'a']],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
  });

  test('valid last', () => {
    expectJsonReadEvalPrint(
      ['last', ['quote', ['a']]],
      the_global_environment
    ).toMatchInlineSnapshot(`"a"`);
  });

  test('invalid last', () => {
    expectJsonReadEvalError(['last', ['quote', 'a']], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['last', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['last', true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['last', []], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['last'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(
      ['last', ['quote', 'a'], ['quote', 'a']],
      the_global_environment
    ).toMatchInlineSnapshot(`undefined`);
  });
});

describe('list constructor primitives', () => {
  test('valid cons', () => {
    expectJsonReadEvalPrint(['cons', 1, 1], the_global_environment).toMatchInlineSnapshot(`
Array [
  1,
  ".",
  1,
]
`);

    expectJsonReadEvalPrint(['cons', 1, ['list']], the_global_environment).toMatchInlineSnapshot(`
Array [
  1,
]
`);
  });

  test('invalid cons', () => {
    expectJsonReadEvalError(['cons'], the_global_environment).toMatchInlineSnapshot(`undefined`);
  });

  test('valid list', () => {
    expectJsonReadEvalPrint(['list', 1, 1], the_global_environment).toMatchInlineSnapshot(`
Array [
  1,
  1,
]
`);

    expectJsonReadEvalPrint(['list', 1, ['list', 1]], the_global_environment)
      .toMatchInlineSnapshot(`
Array [
  1,
  Array [
    1,
  ],
]
`);

    expectJsonReadEvalPrint(['list'], the_global_environment).toMatchInlineSnapshot(`Array []`);
  });

  test('valid list*', () => {
    expectJsonReadEvalPrint(['list*', 1, 1], the_global_environment).toMatchInlineSnapshot(`
Array [
  1,
  ".",
  1,
]
`);

    expectJsonReadEvalPrint(['list*', 1], the_global_environment).toMatchInlineSnapshot(`1`);
  });

  test('invalid list*', () => {
    expectJsonReadEvalError(['list*'], the_global_environment).toMatchInlineSnapshot(`undefined`);
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

  test('invalid and', () => {
    expectJsonReadEvalError(['and', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
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

  test('invalid or', () => {
    expectJsonReadEvalError(['or', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
  });

  test('valid not', () => {
    expectJsonReadEvalPrint(['not', true], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['not', false], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['not', ['not', false]], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
  });

  test('invalid not', () => {
    expectJsonReadEvalError(['not', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['not'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['not', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['not', false, false], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('invalid not', () => {
    expectJsonReadEvalError(['not', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['not'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['not', true, true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['not', false, false], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });

  test('valid nand', () => {
    expectJsonReadEvalPrint(['nand'], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['nand', true], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['nand', false], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['nand', true, true], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['nand', false, false], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(
      ['nand', ['nand', false, true], false],
      the_global_environment
    ).toMatchInlineSnapshot(`true`);
  });

  test('invalid nand', () => {
    expectJsonReadEvalError(['nand', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
  });

  test('valid nor', () => {
    expectJsonReadEvalPrint(['nor'], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['nor', true], the_global_environment).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['nor', false], the_global_environment).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['nor', true, true], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['nor', false, false], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(
      ['nor', ['or', false], false],
      the_global_environment
    ).toMatchInlineSnapshot(`true`);
  });

  test('invalid nor', () => {
    expectJsonReadEvalError(['nor', 1], the_global_environment).toMatchInlineSnapshot(`undefined`);
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

  test('valid implies', () => {
    expectJsonReadEvalPrint(['implies', true, true], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(['implies', true, false], the_global_environment).toMatchInlineSnapshot(
      `false`
    );
    expectJsonReadEvalPrint(['implies', false, true], the_global_environment).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(
      ['implies', false, false],
      the_global_environment
    ).toMatchInlineSnapshot(`true`);
  });

  test('invalid implies', () => {
    expectJsonReadEvalError(['implies'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['implies', true, 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['implies', true], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
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
  });

  test('invalid false?', () => {
    expectJsonReadEvalError(['false?'], the_global_environment).toMatchInlineSnapshot(`undefined`);
    expectJsonReadEvalError(['false?', 1], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
    expectJsonReadEvalError(['false?', false, false], the_global_environment).toMatchInlineSnapshot(
      `undefined`
    );
  });
});
