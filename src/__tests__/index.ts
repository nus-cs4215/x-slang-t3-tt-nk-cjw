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
      "sbox",
      "val",
      "car",
      "cdr",
      "is_atom",
      "is_number",
      "is_boolean",
      "is_nil",
      "is_value",
      "is_list",
      "is_boxed",
      "equals",
      "sexprToJsonsexpr",
      "jsonsexprToSexpr",
      "formatReadErr",
      "readOneDatum",
      "read",
      "print",
      "make_env",
      "make_env_list",
      "evaluate",
      "startRepl",
    ]
  `);
});
