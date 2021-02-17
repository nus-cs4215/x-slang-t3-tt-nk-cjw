import { satom, sboolean, scons, slist, snil, snumber } from '../../sexpr';
import { print } from '../printer';

describe('valid print tests', () => {
  test('basic atoms', () => {
    expect(print(satom('abc'))).toMatchInlineSnapshot(`"abc"`);
    expect(print(satom('abc->def'))).toMatchInlineSnapshot(`"abc->def"`);
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
    expect(print(slist([satom('abc')], snil()))).toMatchInlineSnapshot(`"(abc)"`);
    expect(print(slist([satom('abc'), snumber(123)], snil()))).toMatchInlineSnapshot(`"(abc 123)"`);
    expect(
      print(slist([satom('abc'), snumber(123), sboolean(true)], snil()))
    ).toMatchInlineSnapshot(`"(abc 123 #t)"`);
  });

  test('basic cons', () => {
    expect(print(scons(satom('abc'), snil()))).toMatchInlineSnapshot(`"(abc)"`);
    expect(print(scons(satom('a'), satom('b')))).toMatchInlineSnapshot(`"(a . b)"`);
    expect(print(slist([satom('a'), satom('b')], satom('c')))).toMatchInlineSnapshot(`"(a b . c)"`);
  });
});
