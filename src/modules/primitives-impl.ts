import { is_function_variant } from '../evaluator/datatypes';
import { EvalSExpr, EvalResult } from '../evaluator/types';
import { equals, sboolean, scons, slist, snil, SNumber, snumber, val } from '../sexpr';
import { is_symbol, is_number, is_boolean, is_nil, is_list, is_boxed } from '../sexpr';
import { car, cdr } from '../sexpr';
import { err, ok } from '../utils';

function eq_(...args: EvalSExpr[]) {
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
}
function equal_(...args: EvalSExpr[]) {
  for (let i = 0; i < args.length - 1; i++) {
    const lhs = args[i];
    const rhs = args[i + 1];
    if (!equals(lhs, rhs)) {
      return ok(sboolean(false));
    }
  }
  return ok(sboolean(true));
}
function symbol_eq_(...args: EvalSExpr[]) {
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
}
function number_eq_(...args: EvalSExpr[]) {
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
}
function boolean_eq_(...args: EvalSExpr[]) {
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
}

function symbol_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return ok(sboolean(is_symbol(arg)));
}
function number_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return ok(sboolean(is_number(arg)));
}
function boolean_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return ok(sboolean(is_boolean(arg)));
}
function null_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return ok(sboolean(is_nil(arg)));
}
function cons_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return ok(sboolean(is_list(arg)));
}

function function_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return ok(sboolean(is_boxed(arg) && is_function_variant(arg.val)));
}

function zero_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(sboolean(val(arg) === 0));
}
function positive_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(sboolean(val(arg) > 0));
}
function negative_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(sboolean(val(arg) < 0));
}

function num_plus(...args: EvalSExpr[]) {
  let x = 0;
  for (const arg of args) {
    if (is_number(arg)) {
      x += val(arg);
    } else {
      return err();
    }
  }
  return ok(snumber(x));
}
function num_times(...args: EvalSExpr[]) {
  let x = 1;
  for (const arg of args) {
    if (is_number(arg)) {
      x *= val(arg);
    } else {
      return err();
    }
  }
  return ok(snumber(x));
}
function num_minus(...args: EvalSExpr[]) {
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
}
function num_div(...args: EvalSExpr[]) {
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
}
function quotient(...args: EvalSExpr[]) {
  if (args.length !== 2 || !args.every(is_number)) {
    return err();
  }
  const [n, m] = args;
  if (val(m) === 0) {
    return err();
  }
  return ok(snumber(Math.trunc(val(n) / val(m))));
}
function remainder(...args: EvalSExpr[]) {
  if (args.length !== 2 || !args.every(is_number)) {
    return err();
  }
  const [n, m] = args;
  if (val(m) === 0) {
    return err();
  }
  return ok(snumber(val(n) % val(m)));
}
function modulo(...args: EvalSExpr[]) {
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
}

function round(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.round(val(arg))));
}
function floor(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.floor(val(arg))));
}
function ceiling(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.ceil(val(arg))));
}
function truncate(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.trunc(val(arg))));
}

function sgn(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.sign(val(arg))));
}
function abs(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.abs(val(arg))));
}
function max(...args: EvalSExpr[]) {
  if (!args.every(is_number)) {
    return err();
  }
  return ok(snumber(Math.max(...(args.map(val) as number[]))));
}
function min(...args: EvalSExpr[]) {
  if (!args.every(is_number)) {
    return err();
  }
  return ok(snumber(Math.min(...(args.map(val) as number[]))));
}
function add1(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(val(arg) + 1));
}
function sub1(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(val(arg) - 1));
}
function expt(...args: EvalSExpr[]) {
  if (args.length !== 2) {
    return err();
  }
  const [x, n] = args;
  return !is_number(x) || !is_number(n) ? err() : ok(snumber(Math.pow(val(x), val(n))));
}
function exp(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.exp(val(arg))));
}
function log(...args: EvalSExpr[]) {
  if (args.length !== 1 && args.length !== 2) {
    return err();
  }
  const [arg, base] = args;
  if (base) {
    // val(base) === 0 is manually checked as log 0 in the denominator should raise exception
    // But the Javascript Math.log(0) returns -Infinity instead and causing division with it to return 0
    return !is_number(arg) || !is_number(base)
      ? err()
      : val(arg) === 0 || val(base) === 1 || val(base) === 0
      ? err()
      : ok(snumber(Math.log(val(arg)) / Math.log(val(base))));
  } else {
    return !is_number(arg) || val(arg) === 0 ? err() : ok(snumber(Math.log(val(arg))));
  }
}

function sin(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.sin(val(arg))));
}
function cos(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.cos(val(arg))));
}
function tan(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.tan(val(arg))));
}
function asin(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.asin(val(arg))));
}
function acos(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.acos(val(arg))));
}
function atan(...args: EvalSExpr[]) {
  if (args.length !== 1 && args.length !== 2) {
    return err();
  }
  const [x, y] = args;
  if (y) {
    return !is_number(x) || !is_number(y) ? err() : ok(snumber(Math.atan2(val(x), val(y))));
  } else {
    return !is_number(x) ? err() : ok(snumber(Math.atan(val(x))));
  }
}
function sinh(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.sinh(val(arg))));
}
function cosh(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.cosh(val(arg))));
}
function tanh(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(snumber(Math.tanh(val(arg))));
}

function num_eq(...args: EvalSExpr[]) {
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
}
function num_lt(...args: EvalSExpr[]) {
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
}
function num_gt(...args: EvalSExpr[]) {
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
}
function num_le(...args: EvalSExpr[]) {
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
}
function num_ge(...args: EvalSExpr[]) {
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
}
function nan_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg) ? err() : ok(sboolean(Number.isNaN(val(arg))));
}
function infinite_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return !is_number(arg)
    ? err()
    : ok(sboolean(!Number.isFinite(val(arg)) && !Number.isNaN(val(arg))));
}

function not(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return is_boolean(arg) && val(arg) === false ? ok(sboolean(true)) : ok(sboolean(false));
}
// nand, nor, implies, should be implemented as a stdlib macro
function xor(...args: EvalSExpr[]) {
  if (!args.every(is_boolean)) {
    return err();
  }
  return ok(sboolean(args.reduce((prev, a) => prev !== val(a), false)));
}
function false_(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  return is_boolean(arg) && val(arg) === false ? ok(sboolean(true)) : ok(sboolean(false));
}

function cons(...args: EvalSExpr[]) {
  if (args.length !== 2) {
    return err();
  }
  const [x, y] = args;
  return ok(scons(x, y));
}
function list(...args: EvalSExpr[]) {
  return ok(slist(args, snil()));
}
function list_star(...args: EvalSExpr[]) {
  if (args.length === 0) {
    return err();
  }
  const last = args.pop()!;
  return ok(slist(args, last));
}
function car_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err();
  }
  return ok(car(arg));
}
function cdr_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err();
  }
  return ok(cdr(arg));
}
function first(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err();
  }
  return ok(car(arg));
}
function rest(...args: EvalSExpr[]) {
  if (args.length !== 1) {
    return err();
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err();
  }
  return ok(cdr(arg));
}
function last(...args: EvalSExpr[]) {
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
}
function last_pair(...args: EvalSExpr[]) {
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
}

export const primitive_funcs: Record<string, (...args: EvalSExpr[]) => EvalResult> = {
  'eq?': eq_,
  'equal?': equal_,
  'symbol=?': symbol_eq_,
  'number=?': number_eq_,
  'boolean=?': boolean_eq_,

  'symbol?': symbol_,
  'number?': number_,
  'boolean?': boolean_,
  'null?': null_,
  'cons?': cons_,

  'function?': function_,

  'zero?': zero_,
  'positive?': positive_,
  'negative?': negative_,

  '+': num_plus,
  '*': num_times,
  '-': num_minus,
  '/': num_div,
  quotient,
  remainder,
  modulo,

  round,
  floor,
  ceiling,
  truncate,

  sgn,
  abs,
  max,
  min,
  add1,
  sub1,
  expt,
  exp,
  log,

  sin,
  cos,
  tan,
  asin,
  acos,
  atan,
  sinh,
  cosh,
  tanh,

  '=': num_eq,
  '<': num_lt,
  '>': num_gt,
  '<=': num_le,
  '>=': num_ge,
  'nan?': nan_,
  'infinite?': infinite_,
  not,
  // nand, nor, implies, should be implemented as a stdlib macro
  xor,
  'false?': false_,

  cons,
  list,
  'list*': list_star,
  car: car_,
  cdr: cdr_,
  first,
  rest,
  last,
  'last-pair': last_pair,
};

export const primitive_consts: Record<string, EvalSExpr> = {
  pi: snumber(Math.PI),
  e: snumber(Math.E),
  true: sboolean(true),
  false: sboolean(false),
};
