export function isGoodResult<T, Err>(r: Result<T, Err>): r is GoodResult<T> {
  return r.good;
}
export function isBadResult<T, Err>(r: Result<T, Err>): r is BadResult<Err> {
  return !r.good;
}

export interface GoodResult<T> {
  good: true;
  v: T;
  err: undefined;
}

export interface BadResult<Err> {
  good: false;
  v: undefined;
  err: Err;
}

export function then<T, U, Err>(r: Result<T, Err>, cb: (v: T) => Result<U, Err>): Result<U, Err> {
  if (isGoodResult(r)) {
    return cb(r.v);
  } else {
    return r;
  }
}

export type Result<T, Err> = GoodResult<T> | BadResult<Err>;

export function ok<T>(v: T): GoodResult<T> {
  return { good: true, v, err: undefined };
}

export function err(err?: void): BadResult<void>;
export function err<Err>(err: Err): BadResult<Err>;
export function err<Err>(err: Err): BadResult<Err> {
  return { good: false, v: undefined, err };
}
