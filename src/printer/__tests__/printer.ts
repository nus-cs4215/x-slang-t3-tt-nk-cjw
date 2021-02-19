import { ssymbol, sboolean, scons, slist, snil, snumber, sbox } from '../../sexpr';
import { print } from '../printer';

describe('valid print tests', () => {
  test('basic symbols', () => {
    expect(print(ssymbol('abc'))).toMatchInlineSnapshot(`"abc"`);
    expect(print(ssymbol('abc->def'))).toMatchInlineSnapshot(`"abc->def"`);
  });

  test('basic numbers', () => {
    expect(print(snumber(123))).toMatchInlineSnapshot(`"123"`);
    expect(print(snumber(123.5))).toMatchInlineSnapshot(`"123.5"`);
  });

  test('basic booleans', () => {
    expect(print(sboolean(true))).toMatchInlineSnapshot(`"#t"`);
    expect(print(sboolean(false))).toMatchInlineSnapshot(`"#f"`);
  });

  test('basic parens', () => {
    expect(print(snil())).toMatchInlineSnapshot(`"()"`);
  });

  test('basic list', () => {
    expect(print(slist([ssymbol('abc')], snil()))).toMatchInlineSnapshot(`"(abc)"`);
    expect(print(slist([ssymbol('abc'), snumber(123)], snil()))).toMatchInlineSnapshot(
      `"(abc 123)"`
    );
    expect(
      print(slist([ssymbol('abc'), snumber(123), sboolean(true)], snil()))
    ).toMatchInlineSnapshot(`"(abc 123 #t)"`);
  });

  test('basic cons', () => {
    expect(print(scons(ssymbol('abc'), snil()))).toMatchInlineSnapshot(`"(abc)"`);
    expect(print(scons(ssymbol('a'), ssymbol('b')))).toMatchInlineSnapshot(`"(a . b)"`);
    expect(print(slist([ssymbol('a'), ssymbol('b')], ssymbol('c')))).toMatchInlineSnapshot(
      `"(a b . c)"`
    );
  });

  test('basic boxed', () => {
    expect(print(sbox(null))).toMatchInlineSnapshot(`"#boxed"`);
    expect(print(sbox('anything i want'))).toMatchInlineSnapshot(`"#boxed"`);
    expect(print(sbox(['anything', 'i', 1]))).toMatchInlineSnapshot(`"#boxed"`);
  });
});
