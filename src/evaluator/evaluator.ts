import { Result, err, ok } from '../utils';
import { SExpr } from '../sexpr';

export function evaluate(program: SExpr): Result<SExpr, void> {
  // Normal form
  if (program._type === 'SNumber') {
    return ok(program);
  }
  if (program._type === 'SBoolean') {
    return ok(program);
  }
  if (program._type === 'SNil') {
    return ok(program);
  }
  return err();
}
