import { JsonSExpr, jsonRead, SExpr, jsonPrint } from '../../sexpr';
import { json_plus, json_star, json_var, match, PatternLeaf } from '../special-form';

function expectJsonGoodPatternMatch(program: JsonSExpr<never>, pattern: JsonSExpr<PatternLeaf>) {
  const matches = {};
  const match_success = match(jsonRead(program), jsonRead(pattern), matches);
  expect({ program, pattern, match_success }).toEqual({ program, pattern, match_success: true });
  if (match_success) {
    const json_matches = {};
    Object.entries(matches).forEach(
      ([k, v]: [string, SExpr[]]) => (json_matches[k] = v.map(jsonPrint))
    );
    return expect({ match_success, matches: json_matches });
  } else {
    return expect({ match_success, matches: undefined });
  }
}

function expectJsonBadPatternMatch(program: JsonSExpr<never>, pattern: JsonSExpr<PatternLeaf>) {
  const matches = {};
  const match_success = match(jsonRead(program), jsonRead(pattern), matches);
  expect({ program, pattern, match_success }).toEqual({ program, pattern, match_success: false });
}

describe('Basic pattern matching', () => {
  test('variables and lists, successful match', () => {
    expectJsonGoodPatternMatch(['quote', 'a'], ['quote', json_var('e')]).toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "e": Array [
            "a",
          ],
        },
      }
    `);

    expectJsonGoodPatternMatch(['quote', 'b'], ['quote', json_var('e')]).toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "e": Array [
            "b",
          ],
        },
      }
    `);

    expectJsonGoodPatternMatch(
      ['double-quote', 'a', 'b'],
      ['double-quote', json_var('e1'), json_var('e2')]
    ).toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "e1": Array [
            "a",
          ],
          "e2": Array [
            "b",
          ],
        },
      }
    `);
  });

  test('variables and lists, unsuccessful match', () => {
    expectJsonBadPatternMatch(['double-quote', 'a', 'b'], ['quote', json_var('e')]);
    expectJsonBadPatternMatch(['quote', 'a', '.', 'b'], ['quote', json_var('e')]);
  });

  test('repeats, variables and lists, successful match', () => {
    expectJsonGoodPatternMatch(['list'], ['list', '.', json_star(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {},
      }
    `);

    expectJsonGoodPatternMatch(['list', 1], ['list', '.', json_star(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "xs": Array [
            1,
          ],
        },
      }
    `);

    expectJsonGoodPatternMatch(['list', 1, 2], ['list', '.', json_star(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "xs": Array [
            1,
            2,
          ],
        },
      }
    `);

    expectJsonGoodPatternMatch(['list', 1], ['list', '.', json_plus(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "xs": Array [
            1,
          ],
        },
      }
    `);

    expectJsonGoodPatternMatch(['list', 1, 2], ['list', '.', json_plus(json_var('xs'), [])])
      .toMatchInlineSnapshot(`
      Object {
        "match_success": true,
        "matches": Object {
          "xs": Array [
            1,
            2,
          ],
        },
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
        "match_success": true,
        "matches": Object {
          "id": Array [
            "a",
          ],
          "val-expr": Array [
            "b",
          ],
        },
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
        "match_success": true,
        "matches": Object {
          "id": Array [
            "a",
            "c",
          ],
          "val-expr": Array [
            "b",
            "d",
          ],
        },
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
