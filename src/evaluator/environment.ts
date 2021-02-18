import { EvalValue } from './types';

export type Bindings = Record<string, EvalValue | undefined>;

export interface Environment {
  bindings: Bindings;
  parent: Environment | undefined;
}

export function make_env(bindings: Bindings, parent: Environment | undefined): Environment {
  return { bindings, parent };
}

export function make_env_list(...bindings: [Bindings, ...Bindings[]]): Environment;
export function make_env_list(...bindings: Bindings[]): Environment | undefined;
export function make_env_list(...bindings: Bindings[]): Environment | undefined {
  return bindings.reduceRight((env, bindings) => make_env(bindings, env), undefined);
}

export function find_env(name: string, env_: Environment | undefined): Environment | undefined {
  let env: Environment | undefined;
  for (env = env_; env !== undefined; env = env.parent) {
    if (name in env.bindings) {
      break;
    }
  }
  return env;
}
