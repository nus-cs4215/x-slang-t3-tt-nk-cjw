import { STypes, SExpr, val, car, cdr, is_list, is_nil } from '../sexpr';

export function print(e: SExpr): string {
  switch (e._type) {
    case STypes.Nil:
      return '()';
    case STypes.Atom:
      return val(e);
    case STypes.Number:
      return val(e).toString();
    case STypes.Boolean:
      return val(e) ? '#t' : '#f';
    case STypes.List:
      const output: string[] = ['('];

      // handle first element
      output.push(print(car(e)));

      // handle the rest of the elements
      for (e = cdr(e); is_list(e); e = cdr(e)) {
        output.push(' ', print(car(e)));
      }

      // handle improper list
      if (!is_nil(e)) {
        output.push(' . ', print(e));
      }

      output.push(')');

      return ''.concat(...output);
    default:
      return '';
  }
}
