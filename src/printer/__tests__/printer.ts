import { satom, sboolean, scons, slist, snil, snumber } from '../../sexpr';
// import { getOk } from '../../utils';
import { print } from '../printer';

describe('valid print tests', () => {
  test('basic atoms', () => {
    expect(print(satom('abc'))).toMatchSnapshot();
    expect(print(satom('abc->def'))).toMatchSnapshot();
  });

  test('basic numbers', () => {
    expect(print(snumber(123))).toMatchSnapshot();
    expect(print(snumber(123.5))).toMatchSnapshot();
  });

  test('basic booleans', () => {
    expect(print(sboolean(true))).toMatchSnapshot();
    expect(print(sboolean(false))).toMatchSnapshot();
  });

  test('basic parens', () => {
    expect(print(snil())).toMatchSnapshot();
  });

  test('basic list', () => {
    expect(print(slist([satom('abc')], snil()))).toMatchSnapshot(); // Is this possible?
    expect(print(slist([satom('abc'), snumber(123)], snil()))).toMatchSnapshot();
    expect(print(slist([satom('abc'), snumber(123), sboolean(true)], snil()))).toMatchSnapshot();
  });

  test('basic cons', () => {
    expect(print(scons(satom('abc'), snil()))).toMatchSnapshot();
    expect(print(scons(satom('a'), satom('b')))).toMatchSnapshot();
    expect(print(slist([satom('a'), satom('b')], satom('c')))).toMatchSnapshot();
  });
});
