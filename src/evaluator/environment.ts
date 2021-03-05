import { EvalSExpr } from './types';

export type Bindings = Record<string, EvalSExpr | undefined>;

export interface NonemptyEnvironment {
  bindings: Bindings;
  parent: Environment;
}

export type Environment = undefined | NonemptyEnvironment;

export function make_env(bindings: Bindings, parent: Environment): NonemptyEnvironment {
  return { bindings, parent };
}

export function make_env_list(...bindings: [Bindings, ...Bindings[]]): NonemptyEnvironment;
export function make_env_list(...bindings: Bindings[]): Environment;
export function make_env_list(...bindings: Bindings[]): Environment {
  return bindings.reduceRight((env, bindings) => make_env(bindings, env), undefined);
}

export function find_env(name: string, env_: Environment): Environment {
  let env: Environment;
  for (env = env_; env !== undefined; env = env.parent) {
    if (name in env.bindings) {
      break;
    }
  }
  return env;
}
