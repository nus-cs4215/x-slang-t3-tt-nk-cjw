import { is_function_variant } from '../evaluator/datatypes';
import { EvalSExpr, EvalResult } from '../evaluator/types';
import { print } from '../printer';
import { equals, sboolean, scons, slist, snil, SNumber, snumber, val } from '../sexpr';
import { is_symbol, is_number, is_boolean, is_nil, is_list, is_boxed } from '../sexpr';
import { car, cdr } from '../sexpr';
import { err, ok } from '../utils';

function eq_(...args: EvalSExpr[]): EvalResult {
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
function equal_(...args: EvalSExpr[]): EvalResult {
  for (let i = 0; i < args.length - 1; i++) {
    const lhs = args[i];
    const rhs = args[i + 1];
    if (!equals(lhs, rhs)) {
      return ok(sboolean(false));
    }
  }
  return ok(sboolean(true));
}
function symbol_eq_(...args: EvalSExpr[]): EvalResult {
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
function number_eq_(...args: EvalSExpr[]): EvalResult {
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
function boolean_eq_(...args: EvalSExpr[]): EvalResult {
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

function symbol_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`symbol?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return ok(sboolean(is_symbol(arg)));
}
function number_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`number?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return ok(sboolean(is_number(arg)));
}
function boolean_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`boolean?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return ok(sboolean(is_boolean(arg)));
}
function null_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`null?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return ok(sboolean(is_nil(arg)));
}
function cons_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`cons?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return ok(sboolean(is_list(arg)));
}

function function_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`function?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return ok(sboolean(is_boxed(arg) && is_function_variant(arg.val)));
}

function zero_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`zero?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`zero?: expected number but got ${print(arg)}`)
    : ok(sboolean(val(arg) === 0));
}
function positive_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`positive?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`positive?: expected number but got ${print(arg)}`)
    : ok(sboolean(val(arg) > 0));
}
function negative_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`negative?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`negative?: expected number but got ${print(arg)}`)
    : ok(sboolean(val(arg) < 0));
}

function num_plus(...args: EvalSExpr[]): EvalResult {
  let x = 0;
  for (const arg of args) {
    if (is_number(arg)) {
      x += val(arg);
    } else {
      return err(`+: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
    }
  }
  return ok(snumber(x));
}
function num_times(...args: EvalSExpr[]): EvalResult {
  let x = 1;
  for (const arg of args) {
    if (is_number(arg)) {
      x *= val(arg);
    } else {
      return err(`*: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
    }
  }
  return ok(snumber(x));
}
function num_minus(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`-: expected at least 1 argument`);
  }
  if (args.length === 1) {
    const first = args[0];
    if (is_number(first)) {
      return ok(snumber(0 - val(first)));
    } else {
      return err(`-: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
    }
  }
  const it = args[Symbol.iterator]();
  const first = it.next().value;
  let x: number;
  if (is_number(first)) {
    x = val(first);
  } else {
    return err(`-: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
  }
  for (const arg of it) {
    if (is_number(arg)) {
      x -= val(arg);
    } else {
      return err(`-: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
    }
  }
  return ok(snumber(x));
}
function num_div(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`/: expected at least 1 argument`);
  }
  if (args.length === 1) {
    const first = args[0];
    if (is_number(first)) {
      if (val(first) === 0) {
        return err('/: cannot divide by 0');
      }
      return ok(snumber(1 / val(first)));
    } else {
      return err(`/: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
    }
  }
  const it = args[Symbol.iterator]();
  const first = it.next().value;
  let x: number;
  if (is_number(first)) {
    x = val(first);
  } else {
    return err(`/: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
  }
  for (const arg of it) {
    if (is_number(arg)) {
      if (val(arg) === 0) {
        return err('/: cannot divide by 0');
      }
      x /= val(arg);
    } else {
      return err(`/: expected all arguments to be numbers but got ${args.map(print).join(', ')}`);
    }
  }
  return ok(snumber(x));
}
function quotient(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 2 || !args.every(is_number)) {
    return err(`quotient: expected exactly 2 numbers but got ${args.map(print).join(', ')}`);
  }
  const [n, m] = args;
  if (val(m) === 0) {
    return err('quotient: cannot divide by 0');
  }
  return ok(snumber(Math.trunc(val(n) / val(m))));
}
function remainder(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 2 || !args.every(is_number)) {
    return err(`remainder: expected exactly 2 numbers but got ${args.map(print).join(', ')}`);
  }
  const [n, m] = args;
  if (val(m) === 0) {
    return err('remainder: cannot divide by 0');
  }
  return ok(snumber(val(n) % val(m)));
}
function modulo(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 2 || !args.every(is_number)) {
    return err(`modulo: expected exactly 2 numbers but got ${args.map(print).join(', ')}`);
  }
  const [n, m] = args;
  const vn = val(n);
  const vm = val(m);
  if (vm === 0) {
    return err('modulo: cannot divide by 0');
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

function round(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`round: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`round: expected number but got ${print(arg)}`)
    : ok(snumber(Math.round(val(arg))));
}
function floor(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`floor: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`floor: expected number but got ${print(arg)}`)
    : ok(snumber(Math.floor(val(arg))));
}
function ceiling(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`ceiling: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`ceiling: expected number but got ${print(arg)}`)
    : ok(snumber(Math.ceil(val(arg))));
}
function truncate(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`truncate: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`truncate: expected number but got ${print(arg)}`)
    : ok(snumber(Math.trunc(val(arg))));
}

function sgn(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`sgn: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`sgn: expected number but got ${print(arg)}`)
    : ok(snumber(Math.sign(val(arg))));
}
function abs(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`abs: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`abs: expected number but got ${print(arg)}`)
    : ok(snumber(Math.abs(val(arg))));
}
function max(...args: EvalSExpr[]): EvalResult {
  if (!args.every(is_number)) {
    return err(`max: expected every argument to be number but got ${args.map(print).join(', ')}`);
  }
  return ok(snumber(Math.max(...(args.map(val) as number[]))));
}
function min(...args: EvalSExpr[]): EvalResult {
  if (!args.every(is_number)) {
    return err(`min: expected every argument to be number but got ${args.map(print).join(', ')}`);
  }
  return ok(snumber(Math.min(...(args.map(val) as number[]))));
}
function add1(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`add1: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`add1: expected number but got ${print(arg)}`)
    : ok(snumber(val(arg) + 1));
}
function sub1(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`sub1: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`sub1: expected number but got ${print(arg)}`)
    : ok(snumber(val(arg) - 1));
}
function expt(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 2) {
    return err(`expt: expected exactly 2 arguments but got ${args.map(print).join(', ')}`);
  }
  const [x, n] = args;
  return !is_number(x) || !is_number(n)
    ? err(`expt: expected both arguments to be number but got ${args.map(print).join(', ')}`)
    : ok(snumber(Math.pow(val(x), val(n))));
}
function exp(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`exp: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`exp: expected number but got ${print(arg)}`)
    : ok(snumber(Math.exp(val(arg))));
}
function log(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1 && args.length !== 2) {
    return err(`log: expected 1 or 2 arguments but got ${args.map(print).join(', ')}`);
  }
  const [arg, base] = args;
  if (base) {
    // val(base) === 0 is manually checked as log 0 in the denominator should raise exception
    // But the Javascript Math.log(0) returns -Infinity instead and causing division with it to return 0
    return !is_number(arg) || !is_number(base)
      ? err(`log: expected both arguments to be number but got ${args.map(print).join(', ')}`)
      : val(arg) === 0
      ? err(`log: invalid arg, log is not defined at 0`)
      : val(base) === 1 || val(base) === 0
      ? err(`log: invalid base, base cannot be 0 or 1`)
      : ok(snumber(Math.log(val(arg)) / Math.log(val(base))));
  } else {
    return !is_number(arg)
      ? err(`log: expected argument to be number but got ${print(arg)}`)
      : val(arg) === 0
      ? err(`log: invalid arg, log is not defined at 0`)
      : ok(snumber(Math.log(val(arg))));
  }
}

function sin(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`sin: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`sin: expected number but got ${print(arg)}`)
    : ok(snumber(Math.sin(val(arg))));
}
function cos(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`cos: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`cos: expected number but got ${print(arg)}`)
    : ok(snumber(Math.cos(val(arg))));
}
function tan(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`tan: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`tan: expected number but got ${print(arg)}`)
    : ok(snumber(Math.tan(val(arg))));
}
function asin(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`asin: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`asin: expected number but got ${print(arg)}`)
    : ok(snumber(Math.asin(val(arg))));
}
function acos(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`acos: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`acos: expected number but got ${print(arg)}`)
    : ok(snumber(Math.acos(val(arg))));
}
function atan(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1 && args.length !== 2) {
    return err(`atan: expected exactly 1 or 2 arguments but got ${args.map(print).join(', ')}`);
  }
  const [x, y] = args;
  if (y) {
    return !is_number(x) || !is_number(y)
      ? err(`atan: expected both arguments to be number but got ${args.map(print).join(', ')}`)
      : ok(snumber(Math.atan2(val(x), val(y))));
  } else {
    return !is_number(x)
      ? err(`atan: expected argument to be number but got ${print(x)}`)
      : ok(snumber(Math.atan(val(x))));
  }
}
function sinh(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`sinh: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`sinh: expected number but got ${print(arg)}`)
    : ok(snumber(Math.sinh(val(arg))));
}
function cosh(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`cosh: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`cosh: expected number but got ${print(arg)}`)
    : ok(snumber(Math.cosh(val(arg))));
}
function tanh(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`tanh: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`tanh: expected number but got ${print(arg)}`)
    : ok(snumber(Math.tanh(val(arg))));
}

function num_eq(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`=: expected at least 1 argument`);
  }
  if (!args.every(is_number)) {
    return err(`=: expected every argument to be number but got ${args.map(print).join(', ')}`);
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
function num_lt(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`<: expected at least 1 argument`);
  }
  if (!args.every(is_number)) {
    return err(`<: expected every argument to be number but got ${args.map(print).join(', ')}`);
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
function num_gt(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`>: expected at least 1 argument`);
  }
  if (!args.every(is_number)) {
    return err(`>: expected every argument to be number but got ${args.map(print).join(', ')}`);
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
function num_le(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`<=: expected at least 1 argument`);
  }
  if (!args.every(is_number)) {
    return err(`<=: expected every argument to be number but got ${args.map(print).join(', ')}`);
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
function num_ge(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`>=: expected at least 1 argument`);
  }
  if (!args.every(is_number)) {
    return err(`>=: expected every argument to be number but got ${args.map(print).join(', ')}`);
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
function nan_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`nan?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`nan?: expected number but got ${print(arg)}`)
    : ok(sboolean(Number.isNaN(val(arg))));
}
function infinite_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`infinite?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return !is_number(arg)
    ? err(`infinite?: expected number but got ${print(arg)}`)
    : ok(sboolean(!Number.isFinite(val(arg)) && !Number.isNaN(val(arg))));
}

function not(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`not: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return is_boolean(arg) && val(arg) === false ? ok(sboolean(true)) : ok(sboolean(false));
}
// nand, nor, implies, should be implemented as a stdlib macro
function xor(...args: EvalSExpr[]): EvalResult {
  if (!args.every(is_boolean)) {
    return err(`xor: expected every argument to be boolean but got ${args.map(print).join(', ')}`);
  }
  return ok(sboolean(args.reduce((prev, a) => prev !== val(a), false)));
}
function false_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`false?: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  return is_boolean(arg) && val(arg) === false ? ok(sboolean(true)) : ok(sboolean(false));
}

function cons(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 2) {
    return err(`cons: expected exactly 2 argument but got ${args.map(print).join(', ')}`);
  }
  const [x, y] = args;
  return ok(scons(x, y));
}
function list(...args: EvalSExpr[]): EvalResult {
  return ok(slist(args, snil()));
}
function list_star(...args: EvalSExpr[]): EvalResult {
  if (args.length === 0) {
    return err(`list*: expected at least 1 argument`);
  }
  const last = args.pop()!;
  return ok(slist(args, last));
}
function car_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`car: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err(`car: expected argument to be list but got ${print<unknown>(arg)}`);
  }
  return ok(car(arg));
}
function cdr_(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`car: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err(`cdr: expected argument to be list but got ${print<unknown>(arg)}`);
  }
  return ok(cdr(arg));
}
function first(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`first: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err(`first: expected argument to be list but got ${print<unknown>(arg)}`);
  }
  return ok(car(arg));
}
function rest(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`rest: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  const [arg] = args;
  if (!is_list(arg)) {
    return err(`rest: expected argument to be list but got ${print<unknown>(arg)}`);
  }
  return ok(cdr(arg));
}
function last(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`last: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  let last_pair = args[0];
  if (!is_list(last_pair)) {
    return err(`last: expected argument to be list but got ${print<unknown>(last_pair)}`);
  }
  let tail = cdr(last_pair);
  while (is_list(tail)) {
    last_pair = tail;
    tail = cdr(tail);
  }
  return ok(car(last_pair));
}
function last_pair(...args: EvalSExpr[]): EvalResult {
  if (args.length !== 1) {
    return err(`last_pair: expected exactly 1 argument but got ${args.map(print).join(', ')}`);
  }
  let last_pair = args[0];
  if (!is_list(last_pair)) {
    return err(`last_pair: expected argument to be list but got ${print<unknown>(last_pair)}`);
  }
  let tail = cdr(last_pair);
  while (is_list(tail)) {
    last_pair = tail;
    tail = cdr(tail);
  }
  return ok(last_pair);
}

function console_log(...args: EvalSExpr[]): EvalResult {
  console.log(args.map(print).join('\n'));
  return ok(args[args.length - 1]);
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

  'console-log': console_log,
};

export const primitive_consts: Record<string, EvalSExpr> = {
  pi: snumber(Math.PI),
  e: snumber(Math.E),
  true: sboolean(true),
  false: sboolean(false),
};
