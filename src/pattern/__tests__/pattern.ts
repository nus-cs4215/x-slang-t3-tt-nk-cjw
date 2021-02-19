import { JsonSExpr, jsonRead, SExpr, jsonPrint } from '../../sexpr';
import { json_plus, json_star, json_var, match, PatternLeaf } from '../pattern';

function expectJsonGoodPatternMatch(program: JsonSExpr<never>, pattern: JsonSExpr<PatternLeaf>) {
  const matches = match(jsonRead(program), jsonRead(pattern));
  expect({ program, pattern, matches }).not.toEqual({ program, pattern, undefined });
  const json_matches = {} as Record<string, JsonSExpr<never>[]>;
  Object.entries(matches!).forEach(
    ([k, v]: [string, SExpr[]]) => (json_matches[k] = v.map(jsonPrint))
  );
  return expect(json_matches);
}

function expectJsonBadPatternMatch(program: JsonSExpr<never>, pattern: JsonSExpr<PatternLeaf>) {
  const matches = match(jsonRead(program), jsonRead(pattern));
  expect({ program, pattern, matches }).toEqual({ program, pattern, undefined });
}

describe('Basic pattern matching', () => {
  test('variables and lists, successful match', () => {
    expectJsonGoodPatternMatch(['quote', 'a'], ['quote', json_var('e')]).toMatchInlineSnapshot(`
      Object {
        "e": Array [
          "a",
        ],
      }
    `);

    expectJsonGoodPatternMatch(['quote', 'b'], ['quote', json_var('e')]).toMatchInlineSnapshot(`
      Object {
        "e": Array [
          "b",
        ],
      }
    `);

    expectJsonGoodPatternMatch(
      ['double-quote', 'a', 'b'],
      ['double-quote', json_var('e1'), json_var('e2')]
    ).toMatchInlineSnapshot(`
      Object {
        "e1": Array [
          "a",
        ],
        "e2": Array [
          "b",
        ],
      }
    `);
  });

  test('variables and lists, unsuccessful match', () => {
    expectJsonBadPatternMatch(['double-quote', 'a', 'b'], ['quote', json_var('e')]);
    expectJsonBadPatternMatch(['quote', 'a', '.', 'b'], ['quote', json_var('e')]);
  });

  test('repeats, variables and lists, successful match', () => {
    expectJsonGoodPatternMatch(
      ['list'],
      ['list', '.', json_star(json_var('xs'), [])]
    ).toMatchInlineSnapshot(`Object {}`);

    expectJsonGoodPatternMatch(['list', 1], ['list', '.', json_star(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "xs": Array [
          1,
        ],
      }
    `);

    expectJsonGoodPatternMatch(['list', 1, 2], ['list', '.', json_star(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "xs": Array [
          1,
          2,
        ],
      }
    `);

    expectJsonGoodPatternMatch(['list', 1], ['list', '.', json_plus(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "xs": Array [
          1,
        ],
      }
    `);

    expectJsonGoodPatternMatch(['list', 1, 2], ['list', '.', json_plus(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "xs": Array [
          1,
          2,
        ],
      }
    `);
  });

  test('repeats, variables and lists, unsuccessful match', () => {
    expectJsonBadPatternMatch(['list'], ['list', '.', json_plus(json_var('xs'), [])]);
  });

  test('nested pattern', () => {
    expectJsonGoodPatternMatch([['a', 'b']], json_plus([json_var('id'), json_var('val-expr')], []))
      .toMatchInlineSnapshot(`
      Object {
        "id": Array [
          "a",
        ],
        "val-expr": Array [
          "b",
        ],
      }
    `);

    expectJsonGoodPatternMatch(
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
      json_plus([json_var('id'), json_var('val-expr')], [])
    ).toMatchInlineSnapshot(`
      Object {
        "id": Array [
          "a",
          "c",
        ],
        "val-expr": Array [
          "b",
          "d",
        ],
      }
    `);
  });

  test('let pattern', () => {
    const let_pattern = () => [
      'let',
      json_star([json_var('id'), json_var('val-expr')], []),
      '.',
      json_plus(json_var('body'), []),
    ];
    expectJsonGoodPatternMatch(['let', [], 'a'], let_pattern());
    expectJsonGoodPatternMatch(['let', [['a', 'b']], 'a'], let_pattern());
    expectJsonGoodPatternMatch(
      [
        'let',
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
        'a',
      ],
      let_pattern()
    );
    expectJsonGoodPatternMatch(['let', [], 'a', 'c'], let_pattern());
    expectJsonGoodPatternMatch(
      [
        'let',
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
        'a',
        'c',
      ],
      let_pattern()
    );
  });
});
