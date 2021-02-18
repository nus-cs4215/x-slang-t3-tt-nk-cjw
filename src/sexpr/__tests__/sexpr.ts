import { SExpr } from '../sexpr';
import { satom, snumber, sboolean, snil, scons, slist } from '../sexpr';
import { equals } from '../sexpr';
import { jsonPrint, jsonRead } from '../jsonsexpr';

describe('test equality', () => {
  const values: (() => SExpr)[] = [
    () => satom('abc'),
    () => satom('a.'),
    () => snumber(1),
    () => snumber(999999999999999999999),
    () => sboolean(true),
    () => sboolean(false),
    () => snil(),
  ];

  test('value equality', () => {
    for (let i = 0; i < values.length; i++) {
      const lhs = values[i]();
      const rhs = values[i]();
      const test1 = equals(lhs, rhs);
      const test2 = equals(rhs, lhs);
      expect({ lhs, rhs, test1, test2 }).toEqual({ lhs, rhs, test1: true, test2: true });
    }
  });
  test('value inequality', () => {
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const lhs = values[i]();
        const rhs = values[j]();
        const test1 = equals(lhs, rhs);
        const test2 = equals(rhs, lhs);
        expect({ lhs, rhs, test1, test2 }).toEqual({ lhs, rhs, test1: false, test2: false });
      }
    }
  });

  const one_value_list_structures: ((v: SExpr) => SExpr)[][] = [
    [(v: SExpr) => v],
    [(v: SExpr) => scons(v, v), (v: SExpr) => slist([v], v)],
    [
      (v: SExpr) => scons(v, scons(v, v)),
      (v: SExpr) => scons(v, slist([v], v)),
      (v: SExpr) => slist([v], scons(v, v)),
      (v: SExpr) => slist([v], slist([v], v)),
      (v: SExpr) => slist([v, v], v),
    ],
    [
      (v: SExpr) => scons(scons(v, v), v),
      (v: SExpr) => slist([scons(v, v)], v),
      (v: SExpr) => scons(slist([v], v), v),
      (v: SExpr) => slist([slist([v], v)], v),
    ],
  ];
  test('one value structural list equality', () => {
    for (let vi = 0; vi < values.length; vi++) {
      for (let i = 0; i < one_value_list_structures.length; i++) {
        for (let j = 0; j < one_value_list_structures[i].length; j++) {
          for (let k = j; k < one_value_list_structures[i].length; k++) {
            const lhs = one_value_list_structures[i][j](values[vi]());
            const rhs = one_value_list_structures[i][k](values[vi]());
            const test1 = equals(lhs, rhs);
            const test2 = equals(rhs, lhs);
            expect({ lhs, rhs, test1, test2 }).toEqual({ lhs, rhs, test1: true, test2: true });
          }
        }
      }
    }
  });
  test('same value different structure list inequality', () => {
    for (let vi = 0; vi < values.length; vi++) {
      for (let i = 0; i < one_value_list_structures.length; i++) {
        for (let j = 0; j < one_value_list_structures[i].length; j++) {
          for (let ii = i + 1; ii < one_value_list_structures.length; ii++) {
            for (let jj = 0; jj < one_value_list_structures[ii].length; jj++) {
              const lhs = one_value_list_structures[i][j](values[vi]());
              const rhs = one_value_list_structures[ii][jj](values[vi]());
              const test1 = equals(lhs, rhs);
              const test2 = equals(rhs, lhs);
              expect({ lhs, rhs, test1, test2 }).toEqual({ lhs, rhs, test1: false, test2: false });
            }
          }
        }
      }
    }
  });
  test('different value same structure list inequality', () => {
    for (let vi = 0; vi < values.length; vi++) {
      for (let vii = vi + 1; vii < values.length; vii++) {
        for (let i = 0; i < one_value_list_structures.length; i++) {
          for (let j = 0; j < one_value_list_structures[i].length; j++) {
            for (let k = j; k < one_value_list_structures[i].length; k++) {
              const lhs = one_value_list_structures[i][j](values[vi]());
              const rhs = one_value_list_structures[i][k](values[vii]());
              const test1 = equals(lhs, rhs);
              const test2 = equals(rhs, lhs);
              expect({ lhs, rhs, test1, test2 }).toEqual({ lhs, rhs, test1: false, test2: false });
            }
          }
        }
      }
    }
  });

  const two_value_list_structures: ((v: SExpr, w: SExpr) => SExpr)[][] = [
    [(v: SExpr, w: SExpr) => scons(v, w), (v: SExpr, w: SExpr) => slist([v], w)],
    [(v: SExpr, w: SExpr) => scons(w, v), (v: SExpr, w: SExpr) => slist([w], v)],
    [
      (v: SExpr, w: SExpr) => scons(v, scons(w, snil())),
      (v: SExpr, w: SExpr) => slist([v], scons(w, snil())),
      (v: SExpr, w: SExpr) => scons(v, slist([w], snil())),
      (v: SExpr, w: SExpr) => slist([v, w], snil()),
    ],
    [
      (v: SExpr, w: SExpr) => scons(w, scons(v, snil())),
      (v: SExpr, w: SExpr) => slist([w], scons(v, snil())),
      (v: SExpr, w: SExpr) => scons(w, slist([v], snil())),
      (v: SExpr, w: SExpr) => slist([w, v], snil()),
    ],
  ];
  test('two value structural list equality', () => {
    for (let vi = 0; vi < values.length; vi++) {
      for (let vj = vi + 1; vj < values.length; vj++) {
        for (let i = 0; i < two_value_list_structures.length; i++) {
          for (let j = 0; j < two_value_list_structures[i].length; j++) {
            for (let k = j; k < two_value_list_structures[i].length; k++) {
              const lhs = two_value_list_structures[i][j](values[vi](), values[vj]());
              const rhs = two_value_list_structures[i][k](values[vi](), values[vj]());
              const test1 = equals(lhs, rhs);
              const test2 = equals(rhs, lhs);
              expect({ lhs, rhs, test1, test2 }).toEqual({ lhs, rhs, test1: true, test2: true });
            }
          }
        }
      }
    }
  });
  test('same value different structure list inequality', () => {
    for (let vi = 0; vi < values.length; vi++) {
      for (let vj = vi + 1; vj < values.length; vj++) {
        for (let i = 0; i < two_value_list_structures.length; i++) {
          for (let j = 0; j < two_value_list_structures[i].length; j++) {
            for (let ii = i + 1; ii < two_value_list_structures.length; ii++) {
              for (let jj = 0; jj < two_value_list_structures[ii].length; jj++) {
                const lhs = two_value_list_structures[i][j](values[vi](), values[vj]());
                const rhs = two_value_list_structures[ii][jj](values[vi](), values[vj]());
                const test1 = equals(lhs, rhs);
                const test2 = equals(rhs, lhs);
                expect({ lhs, rhs, test1, test2 }).toEqual({
                  lhs,
                  rhs,
                  test1: false,
                  test2: false,
                });
              }
            }
          }
        }
      }
    }
  });
  test('different value same structure list inequality', () => {
    for (let vi = 0; vi < values.length; vi++) {
      for (let vj = vi + 1; vj < values.length; vj++) {
        for (let vii = vi; vii < values.length; vii++) {
          for (let vjj = vi === vii ? vj + 1 : 0; vjj < values.length; vjj++) {
            for (let i = 0; i < two_value_list_structures.length; i++) {
              for (let j = 0; j < two_value_list_structures[i].length; j++) {
                for (let k = j; k < two_value_list_structures[i].length; k++) {
                  const lhs = two_value_list_structures[i][j](values[vi](), values[vj]());
                  const rhs = two_value_list_structures[i][k](values[vii](), values[vjj]());
                  const test1 = equals(lhs, rhs);
                  const test2 = equals(rhs, lhs);
                  expect({ lhs, rhs, test1, test2 }).toEqual({
                    lhs,
                    rhs,
                    test1: false,
                    test2: false,
                  });
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('SExpr -> JsonSExpr -> SExpr identity', () => {
  const a = satom('a');
  const b = satom('b');
  const z = snumber(0);
  const s = snumber(6);
  const t = sboolean(true);
  const f = sboolean(false);
  const n = snil();

  test.each([[a], [b], [z], [s], [t], [f], [n]] as SExpr[][])('values', (e: SExpr) => {
    expect({ e, test: equals(jsonRead(jsonPrint(e)), e) }).toEqual({
      e,
      test: true,
    });
  });

  test.each([
    [slist([a, b, z, s, t, f], n)],
    [slist([a, b, slist([z, s], t), f], n)],
    [scons(a, b)],
    [slist([a, b], z)],
    [slist([a, b], slist([z, s], t))],
    [slist([a, slist([b, z, s], t)], f)],
  ] as SExpr[][])('lists', (e: SExpr) => {
    expect({ e, test: equals(jsonRead(jsonPrint(e)), e) }).toEqual({
      e,
      test: true,
    });
  });
});
