import { getOk, getErr } from '../../utils';
import { equals } from '../../sexpr';
import { read, formatReadErr } from '../reader';

describe('valid read tests', () => {
  test('basic parens', () => {
    expect(getOk(read('()'))).toMatchSnapshot();
    expect(getOk(read('[]'))).toMatchSnapshot();
    expect(getOk(read('{}'))).toMatchSnapshot();
  });

  test('basic atoms', () => {
    expect(getOk(read('abc'))).toMatchSnapshot();
    expect(getOk(read('abc->def'))).toMatchSnapshot();
  });

  test('basic numbers', () => {
    expect(getOk(read('123'))).toMatchSnapshot();
    expect(getOk(read('123.5'))).toMatchSnapshot();
  });

  test('basic booleans', () => {
    expect(getOk(read('#t'))).toMatchSnapshot();
    expect(getOk(read('#f'))).toMatchSnapshot();
  });

  test('basic lists', () => {
    expect(getOk(read('()'))).toMatchSnapshot();
    expect(getOk(read('(abc)'))).toMatchSnapshot();
    expect(getOk(read('(abc 123)'))).toMatchSnapshot();
    expect(getOk(read('(abc 123 #t)'))).toMatchSnapshot();
  });

  test('basic cons', () => {
    expect(getOk(read('(a . b)'))).toMatchSnapshot();
    expect(getOk(read('(a b . c)'))).toMatchSnapshot();
    expect(equals(getOk(read('(a . ())')), getOk(read('(a)')))).toBe(true);
  });

  test('basic infix', () => {
    expect(equals(getOk(read('(a . b . c)')), getOk(read('(b a c)')))).toBe(true);
    expect(equals(getOk(read('(a b . c . d e)')), getOk(read('(c a b d e)')))).toBe(true);
  });

  test('basic quotes', () => {
    expect(getOk(read("'()"))).toMatchSnapshot();
    expect(getOk(read("('abc)"))).toMatchSnapshot();
    expect(getOk(read("'(abc)"))).toMatchSnapshot();
    expect(getOk(read("'(abc . def)"))).toMatchSnapshot();
    expect(getOk(read("''(abc)"))).toMatchSnapshot();
    expect(getOk(read("'('abc)"))).toMatchSnapshot();
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

  test('bad atoms', () => {
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
