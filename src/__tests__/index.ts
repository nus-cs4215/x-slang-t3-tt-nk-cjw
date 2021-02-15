import * as index from '../index';

test('exports', () => {
  expect(Object.keys(index)).toMatchInlineSnapshot(`
    Array [
      "read",
      "print",
      "evaluate",
      "startRepl",
    ]
  `);
});
