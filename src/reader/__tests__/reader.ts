import { getOk, getErr } from '../../utils';
import { equals, jsonPrint } from '../../sexpr';
import { read, formatReadErr } from '../reader';

function expectReadAsJson(s: string) {
  return expect(jsonPrint(getOk(read(s))));
}

describe('valid read tests', () => {
  test('basic parens', () => {
    expectReadAsJson('()').toMatchInlineSnapshot(`Array []`);
    expectReadAsJson('[]').toMatchInlineSnapshot(`Array []`);
    expectReadAsJson('{}').toMatchInlineSnapshot(`Array []`);
  });

  test('basic symbols', () => {
    expectReadAsJson('abc').toMatchInlineSnapshot(`"abc"`);
    expectReadAsJson('abc->def').toMatchInlineSnapshot(`"abc->def"`);
  });

  test('basic numbers', () => {
    expectReadAsJson('123').toMatchInlineSnapshot(`123`);
    expectReadAsJson('123.5').toMatchInlineSnapshot(`123.5`);
  });

  test('basic booleans', () => {
    expectReadAsJson('#t').toMatchInlineSnapshot(`true`);
    expectReadAsJson('#f').toMatchInlineSnapshot(`false`);
  });

  test('basic lists', () => {
    expectReadAsJson('()').toMatchInlineSnapshot(`Array []`);
    expectReadAsJson('(abc)').toMatchInlineSnapshot(`
      Array [
        "abc",
      ]
    `);
    expectReadAsJson('(abc 123)').toMatchInlineSnapshot(`
      Array [
        "abc",
        123,
      ]
    `);
    expectReadAsJson('(abc 123 #t)').toMatchInlineSnapshot(`
      Array [
        "abc",
        123,
        true,
      ]
    `);
  });

  test('basic cons', () => {
    expectReadAsJson('(a . b)').toMatchInlineSnapshot(`
      Array [
        "a",
        ".",
        "b",
      ]
    `);
    expectReadAsJson('(a b . c)').toMatchInlineSnapshot(`
      Array [
        "a",
        "b",
        ".",
        "c",
      ]
    `);
    expect(equals(getOk(read('(a . ())')), getOk(read('(a)')))).toBe(true);
  });

  test('basic infix', () => {
    expect(equals(getOk(read('(a . b . c)')), getOk(read('(b a c)')))).toBe(true);
    expect(equals(getOk(read('(a b . c . d e)')), getOk(read('(c a b d e)')))).toBe(true);
  });

  test('basic quotes', () => {
    expectReadAsJson("'a").toMatchInlineSnapshot(`
      Array [
        "quote",
        "a",
      ]
    `);
    expectReadAsJson('`a').toMatchInlineSnapshot(`
      Array [
        "quasiquote",
        "a",
      ]
    `);
    expectReadAsJson(',a').toMatchInlineSnapshot(`
      Array [
        "unquote",
        "a",
      ]
    `);
    expectReadAsJson("'()").toMatchInlineSnapshot(`
      Array [
        "quote",
        Array [],
      ]
    `);
    expectReadAsJson('`(+ ,(+ 1 2) ,(+ 3 4))').toMatchInlineSnapshot(`
      Array [
        "quasiquote",
        Array [
          "+",
          Array [
            "unquote",
            Array [
              "+",
              1,
              2,
            ],
          ],
          Array [
            "unquote",
            Array [
              "+",
              3,
              4,
            ],
          ],
        ],
      ]
    `);
    expectReadAsJson("('abc)").toMatchInlineSnapshot(`
      Array [
        Array [
          "quote",
          "abc",
        ],
      ]
    `);
    expectReadAsJson("'(abc)").toMatchInlineSnapshot(`
      Array [
        "quote",
        Array [
          "abc",
        ],
      ]
    `);
    expectReadAsJson("'(abc . def)").toMatchInlineSnapshot(`
      Array [
        "quote",
        Array [
          "abc",
          ".",
          "def",
        ],
      ]
    `);
    expectReadAsJson("''(abc)").toMatchInlineSnapshot(`
      Array [
        "quote",
        Array [
          "quote",
          Array [
            "abc",
          ],
        ],
      ]
    `);
    expectReadAsJson("'('abc)").toMatchInlineSnapshot(`
      Array [
        "quote",
        Array [
          Array [
            "quote",
            "abc",
          ],
        ],
      ]
    `);
  });
});

function expectFormattedReadErr(s: string) {
  return expect(formatReadErr(getErr(read(s)), s));
}

describe('invalid read tests', () => {
  test('bad parens', () => {
    expectFormattedReadErr('(').toMatchInlineSnapshot(`
      "Read error at 1:1 to 1:1: Unexpected EOF
        1 | (
          |  ^

      "
    `);

    expectFormattedReadErr(')').toMatchInlineSnapshot(`
      "Read error at 1:0 to 1:1: Unexpected parenthesis
        1 | )
          | ^

      "
    `);

    expectFormattedReadErr('(]').toMatchInlineSnapshot(`
      "Read error at 1:0 to 1:2: Mismatched parentheses
        1 | (]
          | ^~

      "
    `);

    expectFormattedReadErr('([ abc def )]').toMatchInlineSnapshot(`
      "Read error at 1:1 to 1:12: Mismatched parentheses
        1 | ([ abc def )]
          |  ^~~~~~~~~~~

      "
    `);

    expectFormattedReadErr('([ abc\ndef )]').toMatchInlineSnapshot(`
      "Read error at 1:1 to 2:5: Mismatched parentheses
        1 | ([ abc
          |  ^~~~~
        2 | def )]
          | ~~~~~

      "
    `);

    expectFormattedReadErr('([ abc\ndef\nghi )]').toMatchInlineSnapshot(`
      "Read error at 1:1 to 3:5: Mismatched parentheses
        1   | ([ abc
            |  ^~~~~
        ... | ...
        3   | ghi )]
            | ~~~~~

      "
    `);
  });

  test('bad symbols', () => {
    expectFormattedReadErr('.').toMatchInlineSnapshot(`
      "Read error at 1:0 to 1:1: Unexpected dot
        1 | .
          | ^

      "
    `);
  });

  test('bad delims', () => {
    expectFormattedReadErr("'").toMatchInlineSnapshot(`
      "Read error at 1:1 to 1:1: Unexpected EOF
        1 | '
          |  ^

      "
    `);
  });

  test('bad cons', () => {
    expectFormattedReadErr('(a .)').toMatchInlineSnapshot(`
      "Read error at 1:4 to 1:5: Unexpected parenthesis, missing RHS of cons literal
        1 | (a .)
          |     ^

      "
    `);

    expectFormattedReadErr('(a . b c)').toMatchInlineSnapshot(`
      "Read error at 1:3 to 1:9: Too much data on the RHS of cons literal
        1 | (a . b c)
          |    ^~~~~~

      "
    `);

    expectFormattedReadErr('(. b)').toMatchInlineSnapshot(`
      "Read error at 1:0 to 1:2: Unexpected dot, missing LHS of cons literal or infix list
        1 | (. b)
          | ^~

      "
    `);
  });

  test('bad infix', () => {
    expectFormattedReadErr('(a . b .)').toMatchInlineSnapshot(`
      "Read error at 1:7 to 1:9: Unexpected parenthesis, missing RHS of infix list
        1 | (a . b .)
          |        ^~

      "
    `);

    expectFormattedReadErr('(a . . b)').toMatchInlineSnapshot(`
      "Read error at 1:3 to 1:6: Unexpected dot, missing data between dots of infix list
        1 | (a . . b)
          |    ^~~

      "
    `);

    expectFormattedReadErr('(. a . b)').toMatchInlineSnapshot(`
      "Read error at 1:0 to 1:2: Unexpected dot, missing LHS of cons literal or infix list
        1 | (. a . b)
          | ^~

      "
    `);

    expectFormattedReadErr('(a . b c . d)').toMatchInlineSnapshot(`
      "Read error at 1:3 to 1:10: Unexpected dot, too many data between dots of infix list
        1 | (a . b c . d)
          |    ^~~~~~~

      "
    `);
  });

  test('large line number', () => {
    expectFormattedReadErr('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n)').toMatchInlineSnapshot(`
      "Read error at 19:0 to 19:1: Unexpected parenthesis
        19 | )
           | ^

      "
    `);

    expectFormattedReadErr('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n(\n]').toMatchInlineSnapshot(`
      "Read error at 18:0 to 19:1: Mismatched parentheses
        18 | (
           | ^
        19 | ]
           | ~

      "
    `);

    expectFormattedReadErr('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n(\n\n]').toMatchInlineSnapshot(`
      "Read error at 18:0 to 20:1: Mismatched parentheses
        18  | (
            | ^
        ... | ...
        20  | ]
            | ~

      "
    `);

    expectFormattedReadErr('(\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n]').toMatchInlineSnapshot(`
      "Read error at 1:0 to 19:1: Mismatched parentheses
        1   | (
            | ^
        ... | ...
        19  | ]
            | ~

      "
    `);
  });
});
