import { err, ok } from '../utils';
import { is_number, snumber, val } from '../sexpr';
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
};
