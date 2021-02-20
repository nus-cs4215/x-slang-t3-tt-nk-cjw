import { err, ok } from '../utils';
import { equals, sboolean, scons, slist, snil, SNumber, snumber, val } from '../sexpr';
import { is_symbol, is_number, is_boolean, is_nil, is_list, is_boxed } from '../sexpr';
import { car, cdr } from '../sexpr';
import { EvalValue, EvalResult } from './types';
import { instanceOfEvalData } from './datatypes';

export const primitive_funcs: Record<string, (...args: EvalValue[]) => EvalResult> = {
  'eq?': (...args) => {
    for (let i = 0; i < args.length - 1; i++) {
      const lhs = args[i];
      const rhs = args[i + 1];
      if (
        !(
          (is_symbol(lhs) && is_symbol(rhs) && val(lhs) === val(rhs)) ||
          (is_number(lhs) && is_number(rhs) && val(lhs) === val(rhs)) ||
          (is_boolean(lhs) && is_boolean(rhs) && val(lhs) === val(rhs)) ||
          (is_nil(lhs) && is_nil(rhs)) ||
          (is_list(lhs) && is_list(rhs) && lhs === rhs)
        )
      ) {
        return ok(sboolean(false));
      }
    }
    return ok(sboolean(true));
  },
  'equal?': (...args) => {
    for (let i = 0; i < args.length - 1; i++) {
      const lhs = args[i];
      const rhs = args[i + 1];
      if (!equals(lhs, rhs)) {
        return ok(sboolean(false));
      }
    }
    return ok(sboolean(true));
  },
  'symbol=?': (...args) => {
    if (!args.every(is_symbol)) {
      return ok(sboolean(false));
    }
    for (let i = 0; i < args.length - 1; i++) {
      const lhs = args[i];
      const rhs = args[i + 1];
      if (val(lhs) !== val(rhs)) {
        return ok(sboolean(false));
      }
    }
    return ok(sboolean(true));
  },
  'number=?': (...args) => {
    if (!args.every(is_number)) {
      return ok(sboolean(false));
    }
    for (let i = 0; i < args.length - 1; i++) {
      const lhs = args[i];
      const rhs = args[i + 1];
      if (val(lhs) !== val(rhs)) {
        return ok(sboolean(false));
      }
    }
    return ok(sboolean(true));
  },
  'boolean=?': (...args) => {
    if (!args.every(is_boolean)) {
      return ok(sboolean(false));
    }
    for (let i = 0; i < args.length - 1; i++) {
      const lhs = args[i];
      const rhs = args[i + 1];
      if (val(lhs) !== val(rhs)) {
        return ok(sboolean(false));
      }
    }
    return ok(sboolean(true));
  },

  'symbol?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return ok(sboolean(is_symbol(arg)));
  },
  'number?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return ok(sboolean(is_number(arg)));
  },
  'boolean?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return ok(sboolean(is_boolean(arg)));
  },
  'null?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return ok(sboolean(is_nil(arg)));
  },
  'cons?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return ok(sboolean(is_list(arg)));
  },

  'function?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return ok(sboolean(is_boxed(arg) && instanceOfEvalData(arg.val)));
  },

  'zero?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(sboolean(val(arg) === 0));
  },
  'positive?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(sboolean(val(arg) > 0));
  },
  'negative?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(sboolean(val(arg) < 0));
  },

  '+': (...args) => {
    let x = 0;
    for (const arg of args) {
      if (is_number(arg)) {
        x += val(arg);
      } else {
        return err();
      }
    }
    return ok(snumber(x));
  },
  '*': (...args) => {
    let x = 1;
    for (const arg of args) {
      if (is_number(arg)) {
        x *= val(arg);
      } else {
        return err();
      }
    }
    return ok(snumber(x));
  },
  '-': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (args.length === 1) {
      const first = args[0];
      if (is_number(first)) {
        return ok(snumber(0 - val(first)));
      } else {
        return err();
      }
    }
    const it = args[Symbol.iterator]();
    const first = it.next().value;
    let x: number;
    if (is_number(first)) {
      x = val(first);
    } else {
      return err();
    }
    for (const arg of it) {
      if (is_number(arg)) {
        x -= val(arg);
      } else {
        return err();
      }
    }
    return ok(snumber(x));
  },
  '/': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (args.length === 1) {
      const first = args[0];
      if (is_number(first)) {
        if (val(first) === 0) {
          return err();
        }
        return ok(snumber(1 / val(first)));
      } else {
        return err();
      }
    }
    const it = args[Symbol.iterator]();
    const first = it.next().value;
    let x: number;
    if (is_number(first)) {
      x = val(first);
    } else {
      return err();
    }
    for (const arg of it) {
      if (is_number(arg)) {
        if (val(arg) === 0) {
          return err();
        }
        x /= val(arg);
      } else {
        return err();
      }
    }
    return ok(snumber(x));
  },
  quotient: (...args) => {
    if (args.length !== 2 || !args.every(is_number)) {
      return err();
    }
    const [n, m] = args;
    if (val(m) === 0) {
      return err();
    }
    return ok(snumber(Math.trunc(val(n) / val(m))));
  },
  remainder: (...args) => {
    if (args.length !== 2 || !args.every(is_number)) {
      return err();
    }
    const [n, m] = args;
    if (val(m) === 0) {
      return err();
    }
    return ok(snumber(val(n) % val(m)));
  },
  modulo: (...args) => {
    if (args.length !== 2 || !args.every(is_number)) {
      return err();
    }
    const [n, m] = args;
    const vn = val(n);
    const vm = val(m);
    if (vm === 0) {
      return err();
    }
    const rem = vn % vm;
    if (rem === 0) {
      return ok(snumber(0));
    }
    if (vn > 0 !== vm > 0) {
      return ok(snumber((vn % vm) + vm));
    } else {
      return ok(snumber(vn % vm));
    }
  },

  round: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.round(val(arg))));
  },
  floor: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.floor(val(arg))));
  },
  ceiling: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.ceil(val(arg))));
  },
  truncate: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.trunc(val(arg))));
  },

  sgn: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.sign(val(arg))));
  },
  abs: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.abs(val(arg))));
  },
  max: (...args) => {
    if (!args.every(is_number)) {
      return err();
    }
    return ok(snumber(Math.max(...(args.map(val) as number[]))));
  },
  min: (...args) => {
    if (!args.every(is_number)) {
      return err();
    }
    return ok(snumber(Math.min(...(args.map(val) as number[]))));
  },
  add1: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(val(arg) + 1));
  },
  sub1: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(val(arg) - 1));
  },
  expt: (...args) => {
    if (args.length !== 2) {
      return err();
    }
    const [x, n] = args;
    return !is_number(x) || !is_number(n) ? err() : ok(snumber(Math.pow(val(x), val(n))));
  },
  exp: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.exp(val(arg))));
  },
  log: (...args) => {
    if (args.length !== 1 && args.length !== 2) {
      return err();
    }
    const [arg, base] = args;
    if (base) {
      return !is_number(arg) || !is_number(base)
        ? err()
        : ok(snumber(Math.log(val(arg)) / Math.log(val(base))));
    } else {
      return !is_number(arg) ? err() : ok(snumber(Math.log(val(arg))));
    }
  },

  sin: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.sin(val(arg))));
  },
  cos: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.cos(val(arg))));
  },
  tan: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.tan(val(arg))));
  },
  asin: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.asin(val(arg))));
  },
  acos: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.acos(val(arg))));
  },
  atan: (...args) => {
    if (args.length !== 1 && args.length !== 2) {
      return err();
    }
    const [x, y] = args;
    if (y) {
      return !is_number(x) || !is_number(y) ? err() : ok(snumber(Math.atan2(val(x), val(y))));
    } else {
      return !is_number(x) ? err() : ok(snumber(Math.atan(val(x))));
    }
  },
  sinh: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.sinh(val(arg))));
  },
  cosh: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.cosh(val(arg))));
  },
  tanh: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(snumber(Math.tanh(val(arg))));
  },

  '=': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (!args.every(is_number)) {
      return err();
    }
    const it = args[Symbol.iterator]();
    const z = val(it.next().value as SNumber);
    for (const w of it) {
      if (z !== val(w)) {
        return ok(sboolean(false));
      }
    }
    return ok(sboolean(true));
  },
  '<': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (!args.every(is_number)) {
      return err();
    }
    const it = args[Symbol.iterator]();
    let z = val(it.next().value as SNumber);
    for (const w of it) {
      const wv = val(w);
      if (z >= wv) {
        return ok(sboolean(false));
      }
      z = wv;
    }
    return ok(sboolean(true));
  },
  '>': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (!args.every(is_number)) {
      return err();
    }
    const it = args[Symbol.iterator]();
    let z = val(it.next().value as SNumber);
    for (const w of it) {
      const wv = val(w);
      if (z <= wv) {
        return ok(sboolean(false));
      }
      z = wv;
    }
    return ok(sboolean(true));
  },
  '<=': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (!args.every(is_number)) {
      return err();
    }
    const it = args[Symbol.iterator]();
    let z = val(it.next().value as SNumber);
    for (const w of it) {
      const wv = val(w);
      if (z > wv) {
        return ok(sboolean(false));
      }
      z = wv;
    }
    return ok(sboolean(true));
  },
  '>=': (...args) => {
    if (args.length === 0) {
      return err();
    }
    if (!args.every(is_number)) {
      return err();
    }
    const it = args[Symbol.iterator]();
    let z = val(it.next().value as SNumber);
    for (const w of it) {
      const wv = val(w);
      if (z < wv) {
        return ok(sboolean(false));
      }
      z = wv;
    }
    return ok(sboolean(true));
  },
  'nan?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg) ? err() : ok(sboolean(Number.isNaN(val(arg))));
  },
  'infinite?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_number(arg)
      ? err()
      : ok(sboolean(!Number.isFinite(val(arg)) && !Number.isNaN(val(arg))));
  },

  and: (...args) => {
    if (!args.every(is_boolean)) {
      return err();
    }
    return ok(sboolean(args.reduce((prev, a) => prev && val(a), true)));
  },
  or: (...args) => {
    if (!args.every(is_boolean)) {
      return err();
    }
    return ok(sboolean(args.reduce((prev, a) => prev || val(a), false)));
  },
  not: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_boolean(arg) ? err() : ok(sboolean(!val(arg)));
  },
  nand: (...args) => {
    if (!args.every(is_boolean)) {
      return err();
    }
    return ok(sboolean(!args.reduce((prev, a) => prev && val(a), true)));
  },
  nor: (...args) => {
    if (!args.every(is_boolean)) {
      return err();
    }
    return ok(sboolean(!args.reduce((prev, a) => prev || val(a), false)));
  },
  xor: (...args) => {
    if (!args.every(is_boolean)) {
      return err();
    }
    return ok(sboolean(args.reduce((prev, a) => prev !== val(a), false)));
  },
  implies: (...args) => {
    if (args.length !== 2) {
      return err();
    }
    const [p, q] = args;
    return !is_boolean(p) || !is_boolean(q) ? err() : ok(sboolean(!val(p) || val(q)));
  },
  'false?': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    return !is_boolean(arg) ? err() : ok(sboolean(!val(arg)));
  },

  cons: (...args) => {
    if (args.length !== 2) {
      return err();
    }
    const [x, y] = args;
    return ok(scons(x, y));
  },
  list: (...args) => {
    return ok(slist(args, snil()));
  },
  'list*': (...args) => {
    if (args.length === 0) {
      return err();
    }
    const last = args.pop()!;
    return ok(slist(args, last));
  },
  car: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    if (!is_list(arg)) {
      return err();
    }
    return ok(car(arg));
  },
  cdr: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    if (!is_list(arg)) {
      return err();
    }
    return ok(cdr(arg));
  },
  first: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    if (!is_list(arg)) {
      return err();
    }
    return ok(car(arg));
  },
  rest: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    const [arg] = args;
    if (!is_list(arg)) {
      return err();
    }
    return ok(cdr(arg));
  },
  last: (...args) => {
    if (args.length !== 1) {
      return err();
    }
    let last_pair = args[0];
    if (!is_list(last_pair)) {
      return err();
    }
    let tail = cdr(last_pair);
    while (is_list(tail)) {
      last_pair = tail;
      tail = cdr(tail);
    }
    return ok(car(last_pair));
  },
  'last-pair': (...args) => {
    if (args.length !== 1) {
      return err();
    }
    let last_pair = args[0];
    if (!is_list(last_pair)) {
      return err();
    }
    let tail = cdr(last_pair);
    while (is_list(tail)) {
      last_pair = tail;
      tail = cdr(tail);
    }
    return ok(last_pair);
  },
};

export const primitive_consts: Record<string, EvalValue> = {
  pi: snumber(Math.PI),
  e: snumber(Math.E),
  true: sboolean(true),
  false: sboolean(false),
};
