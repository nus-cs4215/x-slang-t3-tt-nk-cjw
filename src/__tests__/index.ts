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
      "apply_syntax",
      "apply",
      "evaluate",
      "evaluate_top_level",
      "make_empty_bindings",
      "make_bindings",
      "make_bindings_from_record",
      "get_define",
      "get_syntax",
      "has_define",
      "has_syntax",
      "set_define",
      "set_syntax",
      "make_env",
      "make_env_list",
      "find_env",
      "primitives_module",
      "empty_module",
      "startRepl",
    ]
  `);
});
