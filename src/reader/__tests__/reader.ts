import { read } from '../reader';

describe.skip('valid read tests', () => {
  test('basic parens', () => {
    expect(read('()')).toMatchInlineSnapshot({ good: true });
    expect(read('[]')).toMatchInlineSnapshot({ good: true });
    expect(read('{}')).toMatchInlineSnapshot({ good: true });
  });
  test('basic atoms', () => {
    expect(read('abc')).toMatchInlineSnapshot({ good: true });
    expect(read('abc->def')).toMatchInlineSnapshot({ good: true });
  });
  test('basic numbers', () => {
    expect(read('123')).toMatchInlineSnapshot({ good: true });
    expect(read('123.5')).toMatchInlineSnapshot({ good: true });
  });
  test('basic booleans', () => {
    expect(read('#t')).toMatchInlineSnapshot({ good: true });
    expect(read('#f')).toMatchInlineSnapshot({ good: true });
  });
  test('basic lists', () => {
    expect(read('(abc 123 #t)')).toMatchInlineSnapshot({ good: true });
  });
});

describe.skip('invalid read tests', () => {
  test('bad parens', () => {
    expect(read('(')).toMatchInlineSnapshot({ good: false });
    expect(read(')')).toMatchInlineSnapshot({ good: false });
    expect(read('(]')).toMatchInlineSnapshot({ good: false });
  });
  test('bad atoms', () => {
    expect(read('.')).toMatchInlineSnapshot({ good: false });
  });
  test('bad delims', () => {
    expect(read("'")).toMatchInlineSnapshot({ good: false });
    expect(read('\\')).toMatchInlineSnapshot({ good: false });
  });
});
