import { Result, err } from '../utils';
import { SExpr } from '../sexpr';

export function evaluate(program: SExpr): Result<SExpr, void> {
  program;
  return err();
}
