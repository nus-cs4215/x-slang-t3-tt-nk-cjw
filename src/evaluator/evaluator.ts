import { Result, err, ok } from '../utils';
import { SExpr, is_atom, is_number, is_boolean, is_nil } from '../sexpr';

export function evaluate(program: SExpr): Result<SExpr, void> {
  // Normal form
  if (is_atom(program) || is_number(program) || is_boolean(program) || is_nil(program)) {
    return ok(program);
  }
  return err();
}
