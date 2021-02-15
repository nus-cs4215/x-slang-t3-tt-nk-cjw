import { Result, err } from '../utils';
import { SExpr } from '../types';

export function evaluate(program: SExpr): Result<SExpr, void> {
  program;
  return err();
}
