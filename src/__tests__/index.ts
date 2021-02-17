import * as index from '../index';

test('exports', () => {
  expect(Object.keys(index)).toMatchInlineSnapshot(`
    Array [
      "satom",
      "snumber",
      "sboolean",
      "snil",
      "scons",
      "slist",
      "val",
      "car",
      "cdr",
      "sconslist_iterator",
      "equals",
      "sexprToJsonsexpr",
      "jsonsexprToSexpr",
      "formatReadErr",
      "readOneDatum",
      "read",
      "print",
      "evaluate",
      "startRepl",
    ]
  `);
});
