import { flatten_compiled_program_tree } from '../utils';

test('flatten_compiled_program_tree', () => {
  expect(flatten_compiled_program_tree([])).toMatchInlineSnapshot(`Array []`);
  expect(flatten_compiled_program_tree(1)).toMatchInlineSnapshot(`
    Array [
      1,
    ]
  `);
  expect(flatten_compiled_program_tree([1, 2, 3])).toMatchInlineSnapshot(`
    Array [
      1,
      2,
      3,
    ]
  `);
  expect(flatten_compiled_program_tree([[1], 2, [3]])).toMatchInlineSnapshot(`
    Array [
      1,
      2,
      3,
    ]
  `);
  expect(flatten_compiled_program_tree([[1, 2, 3, [4, 5, [6], [7, 8]], 9, 10, [11, 12]]]))
    .toMatchInlineSnapshot(`
    Array [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ]
  `);
});
