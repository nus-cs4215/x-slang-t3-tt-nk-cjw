import { read } from '../reader';
import { print } from '../printer';
import { SExpr } from '../sexpr';
import { ssymbol, snumber, sboolean, snil, scons, slist } from '../sexpr';
import { equals } from '../sexpr';
import { getOk } from '../utils';

describe('print -> read identity', () => {
  const a = ssymbol('a');
  const b = ssymbol('b');
  const z = snumber(0);
  const s = snumber(6);
  const t = sboolean(true);
  const f = sboolean(false);
  const n = snil();

  test.each([[a], [b], [z], [s], [t], [f], [n]] as SExpr[][])('values', (e: SExpr) => {
    const ee = getOk(read(print(e)));
    if (!equals(e, ee)) {
      expect(ee).toBe(e);
    }
  });

  test.each([
    [slist([a, b, z, s, t, f], n)],
    [slist([a, b, slist([z, s], t), f], n)],
    [scons(a, b)],
    [slist([a, b], z)],
    [slist([a, b], slist([z, s], t))],
    [slist([a, slist([b, z, s], t)], f)],
  ] as SExpr[][])('lists', (e: SExpr) => {
    const ee = getOk(read(print(e)));
    if (!equals(e, ee)) {
      expect(ee).toBe(e);
    }
  });
});
