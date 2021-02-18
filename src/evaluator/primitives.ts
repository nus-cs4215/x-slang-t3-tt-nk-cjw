import { err, ok } from '../utils';
import { snumber, val } from '../sexpr';
import { is_number, is_list } from '../sexpr';
import { car, cdr } from '../sexpr';
import { EvalValue, EvalResult } from './types';

export const primitives: Record<string, (...args: EvalValue[]) => EvalResult> = {
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
        x /= val(arg);
      } else {
        return err();
      }
    }
    return ok(snumber(x));
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
};
