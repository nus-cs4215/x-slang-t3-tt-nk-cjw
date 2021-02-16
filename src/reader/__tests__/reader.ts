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
    expect(getOk(read('(abc 123 #t)'))).toMatchSnapshot();
  });

  test('basic cons', () => {
    expect(getOk(read('(a . b)'))).toMatchSnapshot();
    expect(getOk(read('(a . .)'))).toMatchSnapshot();
    expect(getOk(read('(a b . c)'))).toMatchSnapshot();
    expect(equals(getOk(read('(a . b . c)')), getOk(read('(a . c)')))).toBe(true);
    expect(equals(getOk(read('(a . ())')), getOk(read('(a)')))).toBe(true);
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
      "Read error at 1:0 to 1:1: Lone dot not allowed at top level
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
      "Read error at 1:4 to 1:5: Unexpected parenthesis
        1 | (a .)
          |     ^

      "
    `);

    expectFormattedReadErr('(a . . .)').toMatchInlineSnapshot(`
      "Read error at 1:8 to 1:9: Unexpected parenthesis
        1 | (a . . .)
          |         ^

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
