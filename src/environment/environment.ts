import { SExprT } from '../sexpr';

type MaybeSExpr = SExprT<unknown> | undefined;
type StringSExprMap = Map<string, MaybeSExpr>;

export enum BindingType {
  Define,
  Syntax,
}

export interface DefineBinding {
  _type: BindingType.Define;
  val: MaybeSExpr;
}
export interface SyntaxBinding {
  _type: BindingType.Syntax;
  val: SExprT<unknown>;
}

export const define_binding = (val: MaybeSExpr): DefineBinding => ({
  _type: BindingType.Define,
  val,
});
export const syntax_binding = (val: SExprT<unknown>): SyntaxBinding => ({
  _type: BindingType.Syntax,
  val,
});

export type Binding = DefineBinding | SyntaxBinding;

export type Bindings = Map<string, Binding>;

export const make_empty_bindings = (): Bindings => new Map();
export const make_bindings = (defines: StringSExprMap, syntaxes: Map<string, SExprT<unknown>>) => {
  const bs: [string, Binding][] = [];
  defines.forEach((val, name) => bs.push([name, define_binding(val)]));
  syntaxes.forEach((val, name) => bs.push([name, syntax_binding(val)]));
  return new Map(bs);
};

export const make_bindings_from_record = (
  defines: Record<string, MaybeSExpr>,
  syntaxes: Record<string, SExprT<unknown>>
) => make_bindings(new Map(Object.entries(defines)), new Map(Object.entries(syntaxes)));

export const get_define = (bindings: Bindings, name: string): MaybeSExpr => {
  const binding = bindings.get(name);
  if (binding === undefined || binding._type !== BindingType.Define) {
    return undefined;
  } else {
    return binding.val;
  }
};

export const get_syntax = (bindings: Bindings, name: string): MaybeSExpr => {
  const binding = bindings.get(name);
  if (binding === undefined || binding._type !== BindingType.Syntax) {
    return undefined;
  } else {
    return binding.val;
  }
};

export const has_define = (bindings: Bindings, name: string): boolean => {
  const binding = bindings.get(name);
  return binding !== undefined && binding._type === BindingType.Define;
};
export const has_syntax = (bindings: Bindings, name: string): boolean => {
  const binding = bindings.get(name);
  return binding !== undefined && binding._type === BindingType.Syntax;
};

export const set_define = (bindings: Bindings, name: string, value: MaybeSExpr): void => {
  bindings.set(name, define_binding(value!));
};
export const set_syntax = (bindings: Bindings, name: string, value: SExprT<unknown>): void => {
  bindings.set(name, syntax_binding(value));
};

export function* get_all_defines(
  bindings: Bindings
): Iterator<[string, MaybeSExpr]> & Iterable<[string, MaybeSExpr]> {
  for (const [name, binding] of bindings.entries()) {
    if (binding._type === BindingType.Define) {
      yield [name, binding.val];
    }
  }
}

export function* get_all_syntaxes(
  bindings: Bindings
): Iterator<[string, SExprT<unknown>]> & Iterable<[string, SExprT<unknown>]> {
  for (const [name, binding] of bindings.entries()) {
    if (binding._type === BindingType.Syntax) {
      yield [name, binding.val];
    }
  }
}

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
