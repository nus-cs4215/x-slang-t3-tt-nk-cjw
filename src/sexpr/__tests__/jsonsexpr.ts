import { satom, snil, scons, slist } from '../sexpr';
import { sexprToJsonsexpr } from '../jsonsexpr';

test('correct json representation of complex lists', () => {
  expect(sexprToJsonsexpr(scons(snil(), snil()))).toMatchInlineSnapshot(`
    Array [
      Array [],
    ]
  `);
  expect(sexprToJsonsexpr(scons(snil(), scons(snil(), snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(sexprToJsonsexpr(slist([snil()], scons(snil(), snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(sexprToJsonsexpr(scons(snil(), slist([snil()], snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(sexprToJsonsexpr(slist([snil()], slist([snil()], snil())))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(sexprToJsonsexpr(slist([snil(), snil()], snil()))).toMatchInlineSnapshot(`
    Array [
      Array [],
      Array [],
    ]
  `);
  expect(sexprToJsonsexpr(scons(scons(snil(), snil()), snil()))).toMatchInlineSnapshot(`
    Array [
      Array [
        Array [],
      ],
    ]
  `);
  expect(sexprToJsonsexpr(scons(satom('a'), satom('b')))).toMatchInlineSnapshot(`
    Array [
      "a",
      ".",
      "b",
    ]
  `);
  expect(sexprToJsonsexpr(scons(satom('a'), scons(satom('b'), satom('c'))))).toMatchInlineSnapshot(`
    Array [
      "a",
      "b",
      ".",
      "c",
    ]
  `);
});
