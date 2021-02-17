import * as index from '../index';

test('exports', () => {
  expect(Object.keys(index)).toMatchInlineSnapshot(`
    Array [
      "STypes",
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
      "is_atom",
      "is_number",
      "is_boolean",
      "is_nil",
      "is_list",
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
