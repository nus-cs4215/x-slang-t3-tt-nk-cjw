import { jsonRead, jsonPrint } from '../jsonsexpr';
import { ssymbol, snil, scons, slist } from '../sexpr';

test('correct json representation of complex lists', () => {
  expect(jsonPrint(scons(snil(), snil()))).toMatchInlineSnapshot(`
    Array [
      Array [],
    ]
  `);
  expect(jsonPrint(scons(snil(), scons(snil(), snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(jsonPrint(slist([snil()], scons(snil(), snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(jsonPrint(scons(snil(), slist([snil()], snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(jsonPrint(slist([snil()], slist([snil()], snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(jsonPrint(slist([snil(), snil()], snil()))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(jsonPrint(scons(scons(snil(), snil()), snil()))).toMatchInlineSnapshot(`
    Array [
      Array [
        Array [],
      ],
    ]
  `);
  expect(jsonPrint(scons(ssymbol('a'), ssymbol('b')))).toMatchInlineSnapshot(`
    Array [
      "a",
      ".",
      "b",
    ]
  `);
  expect(jsonPrint(scons(ssymbol('a'), scons(ssymbol('b'), ssymbol('c'))))).toMatchInlineSnapshot(`
    Array [
      "a",
      "b",
      ".",
      "c",
    ]
  `);
});

test('Correct reading of Json lists', () => {
  expect(jsonRead('[]')).toStrictEqual({ _type: 0, val: '[]' });
  expect(jsonRead([])).toStrictEqual({ _type: 3 });
  expect(jsonRead(['a'])).toEqual(slist([ssymbol('a')], snil()));
  expect(jsonRead(['a', 'b'])).toEqual(slist([ssymbol('a'), ssymbol('b')], snil()));
});
