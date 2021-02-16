import { Result, err } from '../utils';
import { SExpr } from '../sexpr';

export interface Location {
  line: number;
  column: number;
}

export interface ReadErr {
  message: string;
  start?: Location;
  end?: Location;
}

export type ReadResult = Result<SExpr, ReadErr>;

export function read(s: string): ReadResult {
  s;
  return err({ message: 'Not implemented yet' });
}
