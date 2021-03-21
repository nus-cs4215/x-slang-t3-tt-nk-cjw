import { JsonSExpr, JsonSExprT, jsonRead, SExpr, jsonPrint } from '../../sexpr';
import { getOk } from '../../utils';
import {
  json_plus,
  json_star,
  json_symvar,
  json_var,
  match,
  PatternLeaf,
  read_pattern,
} from '../pattern';

function expectJsonGoodPatternMatch(program: JsonSExpr, pattern: JsonSExprT<PatternLeaf>) {
  const matches = match(jsonRead(program), jsonRead(pattern));
  if (matches === undefined) {
    expect({ program, pattern, matches }).not.toEqual({ program, pattern, undefined });
  }
  const json_matches = {} as Record<string, JsonSExpr[]>;
  Object.entries(matches!).forEach(
    ([k, v]: [string, SExpr[]]) => (json_matches[k] = v.map(jsonPrint))
  );
  return expect(json_matches);
}

function expectJsonBadPatternMatch(program: JsonSExpr, pattern: JsonSExprT<PatternLeaf>) {
  const matches = match(jsonRead(program), jsonRead(pattern));
  if (matches !== undefined) {
    expect({ program, pattern, matches }).toEqual({ program, pattern, undefined });
  }
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

describe('sexpr pattern parsing', () => {
  test('literals', () => {
    expect(jsonPrint(getOk(read_pattern("('a 'b 'c 'd)")))).toMatchInlineSnapshot(`
      Array [
        "a",
        "b",
        "c",
        "d",
      ]
    `);
    expect(jsonPrint(getOk(read_pattern("('a b 'c . 'd)")))).toMatchInlineSnapshot(`
      Array [
        "a",
        Object {
          "boxed": Object {
            "name": "b",
            "variant": 0,
          },
        },
        "c",
        ".",
        "d",
      ]
    `);
    expect(jsonPrint(getOk(read_pattern('(1 #t 3 . 55)')))).toMatchInlineSnapshot(`
      Array [
        1,
        true,
        3,
        ".",
        55,
      ]
    `);
  });

  test('vars', () => {
    expect(jsonPrint(getOk(read_pattern("('quote datum)")))).toMatchInlineSnapshot(`
      Array [
        "quote",
        Object {
          "boxed": Object {
            "name": "datum",
            "variant": 0,
          },
        },
      ]
    `);
    expect(jsonPrint(getOk(read_pattern("('define sym-name value)")))).toMatchInlineSnapshot(`
      Array [
        "define",
        Object {
          "boxed": Object {
            "name": "name",
            "variant": 1,
          },
        },
        Object {
          "boxed": Object {
            "name": "value",
            "variant": 0,
          },
        },
      ]
    `);
  });

  test('subpatterns', () => {
    expect(getOk(read_pattern("('lambda (sym-params ...) body ...)"))).toEqual(
      jsonRead([
        'lambda',
        json_star(json_symvar('params'), []),
        '.',
        json_star(json_var('body'), []),
      ])
    );
    expect(getOk(read_pattern("('let [(sym-name value) ...] body ...)"))).toEqual(
      jsonRead([
        'let',
        json_star([json_symvar('name'), json_var('value')], []),
        '.',
        json_star(json_var('body'), []),
      ])
    );
    expect(getOk(read_pattern("('atleastone value ...+)"))).toEqual(
      jsonRead(['atleastone', '.', json_plus(json_var('value'), [])])
    );
    expect(getOk(read_pattern("('atleastone ['ayy value] ...+)"))).toEqual(
      jsonRead(['atleastone', '.', json_plus(['ayy', json_var('value')], [])])
    );
  });
});
