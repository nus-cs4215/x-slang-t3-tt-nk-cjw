import { Result, err } from '../utils';
import { SExpr } from '../types';

export function read(s: string): Result<SExpr, void> {
  s;
  return err();
}
