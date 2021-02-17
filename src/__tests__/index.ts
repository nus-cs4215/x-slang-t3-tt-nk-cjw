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
      "car",
      "cdr",
      "sconslist_iterator",
      "equals",
      "formatReadErr",
      "readOneDatum",
      "read",
      "print",
      "evaluate",
      "startRepl",
    ]
  `);
});
