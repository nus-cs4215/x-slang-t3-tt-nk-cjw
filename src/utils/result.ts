export type Result<T, Err> = [T, undefined] | [undefined, Err];

export function ok<T, Err>(v: T): Result<T, Err> {
  return [v, undefined];
}

export function err<T>(err?: void): Result<T, void>;
export function err<T, Err>(err: Err): Result<T, Err>;
export function err<T, Err>(err: Err): Result<T, Err> {
  return [undefined, err];
}
