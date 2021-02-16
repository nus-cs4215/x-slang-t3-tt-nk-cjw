import { SExpr } from '../sexpr';

export function print(e: SExpr): string {
  if (e._type == 'SAtom') {
    return e.val;
  } else if (e._type == "SNumber") {
    return e.val.toString();
  } else if (e._type == "SBoolean") {
    if (e.val) {
      return "#t";
    } else {
      return "#f";
    }
  } else {
    return "";
  }
}
