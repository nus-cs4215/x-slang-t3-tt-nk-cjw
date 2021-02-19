import { ssymbol, snil, scons, slist } from '../sexpr';
import { jsonPrint } from '../jsonsexpr';

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
