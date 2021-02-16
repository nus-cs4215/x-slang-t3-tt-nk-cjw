import { satom, sboolean, snumber } from '../../sexpr';
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
});
