import * as index from '../index';

test('exports', () => {
  expect(Object.keys(index)).toMatchInlineSnapshot(`
    Array [
      "STypes",
      "ssymbol",
      "snumber",
      "sboolean",
      "snil",
      "scons",
      "slist",
      "sbox",
      "val",
      "car",
      "cdr",
      "is_symbol",
      "is_number",
      "is_boolean",
      "is_nil",
      "is_value",
      "is_list",
      "is_boxed",
      "equals",
      "jsonPrint",
      "jsonRead",
      "formatReadErr",
      "readOneDatum",
      "read",
      "print",
      "make_env",
      "make_env_list",
      "the_global_environment",
      "evaluate",
      "startRepl",
    ]
  `);
});
