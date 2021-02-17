import { SExpr } from '../sexpr';

export function print(e: SExpr): string {
  switch (e._type) {
    case 'SNil':
      return '()';
    case 'SAtom':
      return e.val;
    case 'SNumber':
      return e.val.toString();
    case 'SBoolean':
      if (e.val) {
        return '#t';
      } else {
        return '#f';
      }
    case 'SCons':
      const first = print(e.first);
      const rest = e.rest._type === 'SNil' ? '' : ' . ' + print(e.rest);

      return '(' + first + rest + ')';
    case 'SList':
      const elems = e.elems.map((elem) => print(elem)).join(' ');
      const tail = e.tail._type === 'SNil' ? '' : ' . ' + print(e.tail);

      return '(' + elems + tail + ')';
    default:
      return '';
  }
}
