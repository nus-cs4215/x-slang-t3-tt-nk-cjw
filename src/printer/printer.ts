import { SExpr } from '../sexpr';

export function print(e: SExpr): string {
  if (e._type === 'SNil') {
    return '()';
  } else if (e._type === 'SAtom') {
    return e.val;
  } else if (e._type === 'SNumber') {
    return e.val.toString();
  } else if (e._type === 'SBoolean') {
    if (e.val) {
      return '#t';
    } else {
      return '#f';
    }
  } else if (e._type === 'SList') {
    const elems = e.elems.map((elem) => print(elem)).join(' ');
    const tail = e.tail._type === 'SNil' ? '' : ' ' + print(e.tail);
    return '(' + elems + tail + ')';
  } else {
    return '';
  }
}
