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
};
