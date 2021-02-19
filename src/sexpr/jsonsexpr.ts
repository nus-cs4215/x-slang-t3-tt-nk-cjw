import { sbox, SListStruct } from './sexpr';
import { val, car, cdr } from './sexpr';
import { satom, snumber, sboolean, snil, slist } from './sexpr';
import { is_atom, is_number, is_boolean, is_nil, is_list, is_boxed } from './sexpr';

export type JsonSExpr<T> = JsonSExpr<T>[] | string | number | boolean | { boxed: T };

export function jsonPrint<T>(e: SListStruct<T>): JsonSExpr<T> {
  if (is_atom(e) || is_number(e) || is_boolean(e)) {
    return val(e);
  } else if (is_nil(e)) {
    return [];
  } else if (is_boxed(e)) {
    return { boxed: e.val };
  } else {
    // if (e._type === STypes.List) {
    const xs = [];
    xs.push(jsonPrint(car(e)));
    e = cdr(e);
    for (; is_list(e); e = cdr(e)) {
      xs.push(jsonPrint(car(e)));
    }
    if (!is_nil(e)) {
      xs.push('.');
      xs.push(jsonPrint(e));
    }
    return xs;
  }
}

export function jsonRead<T>(j: JsonSExpr<T>): SListStruct<T> {
  if (typeof j === 'string') {
    return satom(j);
  } else if (typeof j === 'number') {
    return snumber(j);
  } else if (typeof j === 'boolean') {
    return sboolean(j);
  } else if (Array.isArray(j)) {
    if (j.length === 0) {
      return snil();
    }
    if (j.length >= 3 && j[j.length - 2] === '.') {
      const tail = jsonRead(j.pop()!);
      j.pop();
      return slist(j.map(jsonRead), tail);
    }
  } else {
    // j is object, so it's the boxed type
    return sbox(j.boxed) as any; // couldn't figure out how to typecheck this
  }
  return slist(j.map(jsonRead), snil());
}
