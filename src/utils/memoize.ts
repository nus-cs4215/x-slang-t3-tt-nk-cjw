export function memoize<F extends (arg: any) => any>(func: F): F {
  const cache: Map<any, any> = new Map();
  return (((arg: any) => {
    if (cache.has(arg)) {
      return cache.get(arg);
    } else {
      const result = func(arg);
      cache.set(arg, result);
      return result;
    }
  }) as Function) as F;
}
