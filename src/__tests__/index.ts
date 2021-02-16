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
      "sconslist_iterator",
      "equals",
      "readOneDatum",
      "read",
      "print",
      "evaluate",
      "startRepl",
    ]
  `);
});
