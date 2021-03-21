import { CompileV2 } from '../compiler/types';
import { SExprT } from '../sexpr';

type MaybeSExpr = SExprT<unknown> | undefined;
type StringSExprMap = Map<string, MaybeSExpr>;

type CoreTransformer = CompileV2;

export enum BindingType {
  Define,
  Syntax,
  Core,
}

export interface DefineBinding {
  _type: BindingType.Define;
  val: MaybeSExpr;
}
export interface SyntaxBinding {
  _type: BindingType.Syntax;
  val: SExprT<unknown>;
}
export interface CoreBinding {
  _type: BindingType.Core;
  fun: CoreTransformer;
}

export const define_binding = (val: MaybeSExpr): DefineBinding => ({
  _type: BindingType.Define,
  val,
});
export const syntax_binding = (val: SExprT<unknown>): SyntaxBinding => ({
  _type: BindingType.Syntax,
  val,
});
export const core_binding = (fun: CoreTransformer): CoreBinding => ({
  _type: BindingType.Core,
  fun,
});

export type Binding = DefineBinding | SyntaxBinding | CoreBinding;

export type Bindings = Map<string, Binding>;

export const make_empty_bindings = (): Bindings => new Map();
export const make_bindings = (
  defines: StringSExprMap,
  syntaxes: Map<string, SExprT<unknown>>,
  cores: Map<string, CompileV2> = new Map()
) => {
  const bs: [string, Binding][] = [];
  defines.forEach((val, name) => bs.push([name, define_binding(val)]));
  syntaxes.forEach((val, name) => bs.push([name, syntax_binding(val)]));
  cores.forEach((val, name) => bs.push([name, core_binding(val)]));
  return new Map(bs);
};

export const make_bindings_from_map_of_binding = (bindings: Bindings) => {
  return bindings;
};

export const make_bindings_from_record = (
  defines: Record<string, MaybeSExpr>,
  syntaxes: Record<string, SExprT<unknown>>,
  cores: Record<string, CompileV2> = {}
) =>
  make_bindings(
    new Map(Object.entries(defines)),
    new Map(Object.entries(syntaxes)),
    new Map(Object.entries(cores))
  );

export function get_binding(bindings: Bindings, name: string): Binding | undefined {
  return bindings.get(name);
}

export function has_binding(bindings: Bindings, name: string): boolean {
  return bindings.has(name);
}

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

export const get_core = (bindings: Bindings, name: string): CoreTransformer | undefined => {
  const binding = bindings.get(name);
  if (binding === undefined || binding._type !== BindingType.Core) {
    return undefined;
  } else {
    return binding.fun;
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
export const has_core = (bindings: Bindings, name: string): boolean => {
  const binding = bindings.get(name);
  return binding !== undefined && binding._type === BindingType.Core;
};

export const set_define = (bindings: Bindings, name: string, value: MaybeSExpr): void => {
  bindings.set(name, define_binding(value!));
};
export const set_syntax = (bindings: Bindings, name: string, value: SExprT<unknown>): void => {
  bindings.set(name, syntax_binding(value));
};
export function set_core(bindings: Bindings, name: string, value: CoreTransformer): void {
  bindings.set(name, core_binding(value));
}
export function install_bindings(destination: Bindings, source: Bindings) {
  for (const [name, binding] of source.entries()) {
    destination.set(name, binding);
  }
}

export function* get_all_bindings(
  bindings: Bindings
): Iterator<[string, Binding]> & Iterable<[string, Binding]> {
  yield* bindings.entries();
}

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

export function find_env(name: string, env: Environment): Environment {
  for (; env !== undefined; env = env.parent) {
    if (has_binding(env.bindings, name)) {
      break;
    }
  }
  return env;
}

export function lookup_binding(name: string, env: Environment): Binding | undefined {
  const found_env = find_env(name, env);
  if (found_env === undefined) {
    return undefined;
  }
  return get_binding(found_env.bindings, name);
}
