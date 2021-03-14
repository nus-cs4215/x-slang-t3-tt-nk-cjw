import { SExprT } from '../sexpr';

type MaybeSExpr = SExprT<unknown> | undefined;
type StringSExprMap = Map<string, MaybeSExpr>;

export interface Bindings {
  definitions: StringSExprMap;
  syntaxes: StringSExprMap;
}

export const make_empty_bindings = () => ({
  definitions: new Map(),
  syntaxes: new Map(),
});
export const make_bindings = (definitions: StringSExprMap, syntaxes: StringSExprMap) => ({
  definitions,
  syntaxes,
});
export const make_bindings_from_record = (
  definitions: Record<string, MaybeSExpr>,
  syntaxes: Record<string, MaybeSExpr>
) => make_bindings(new Map(Object.entries(definitions)), new Map(Object.entries(syntaxes)));

export const get_define = (bindings: Bindings, name: string): MaybeSExpr =>
  bindings.definitions.get(name);
export const get_syntax = (bindings: Bindings, name: string): MaybeSExpr =>
  bindings.syntaxes.get(name);

export const has_define = (bindings: Bindings, name: string): boolean =>
  bindings.definitions.has(name);
export const has_syntax = (bindings: Bindings, name: string): boolean =>
  bindings.syntaxes.has(name);

export const set_define = (bindings: Bindings, name: string, value: MaybeSExpr): void => {
  bindings.definitions.set(name, value);
};
export const set_syntax = (bindings: Bindings, name: string, value: MaybeSExpr): void => {
  bindings.definitions.set(name, value);
};

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
    if (has_define(env.bindings, name) || has_syntax(env.bindings, name)) {
      break;
    }
  }
  return env;
}
