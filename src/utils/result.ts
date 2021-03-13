export function isGoodResult<T, Err>(r: Result<T, Err>): r is GoodResult<T> {
  return r.good;
}
export function isBadResult<T, Err>(r: Result<T, Err>): r is BadResult<Err> {
  return !r.good;
}

export function getOk<T, Err>(r: Result<T, Err>): T {
  if (isGoodResult(r)) {
    return r.v;
  } else {
    throw r.err;
  }
}

class ExpectedErrError<T> extends Error {
  v: T;
  constructor(v: T) {
    super(`Expected Err but got: ${v}`);
  }
}

export function getErr<T, Err>(r: Result<T, Err>): Err {
  if (isGoodResult(r)) {
    throw new ExpectedErrError(r.v);
  } else {
    return r.err;
  }
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

export function cases<T, Err, U>(r: Result<T, Err>, good: (v: T) => U, bad: (err: Err) => U): U {
  if (isGoodResult(r)) {
    return good(r.v);
  } else {
    return bad(r.err);
  }
}

export type Result<T, Err> = GoodResult<T> | BadResult<Err>;

export function ok<T>(v: T): GoodResult<T> {
  return { good: true, v, err: undefined };
}

export function ok_unless_void<T, Err>(
  v: Exclude<T, void> | void,
  err: Err
): Result<Exclude<T, void>, Err> {
  if (v === undefined) {
    return { good: false, v: undefined, err };
  } else {
    return { good: true, v, err: undefined };
  }
}

export function err(err?: void): BadResult<void>;
export function err<Err>(err: Err): BadResult<Err>;
export function err<Err>(err: Err): BadResult<Err> {
  return { good: false, v: undefined, err };
}
