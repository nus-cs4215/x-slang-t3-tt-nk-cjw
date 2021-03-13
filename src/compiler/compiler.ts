import { Environment } from '../environment';
import { TopLevelForm } from '../fep-types';
import { json_var, match } from '../pattern';
import { read } from '../reader';
import { is_symbol, jsonRead, SExpr, val } from '../sexpr';
import { err, isBadResult, ok, Result } from '../utils';
import { builtin_module_resolver } from './compiler-base';
import { CompileModule, CompileErr } from './types';

const module_pattern = jsonRead([
  'module',
  json_var('module_name'),
  json_var('module_path'),
  '.',
  json_var('body'),
]);
const quoted_module_path_pattern = jsonRead(['quote', json_var('module_path')]);
interface ModuleInfo {
  name: string;
  // true means the module_path matches (quote ...)
  module_path_is_builtin: boolean;
  module_path_name: string;
  module_body: SExpr;
}

function get_module_info(program: SExpr): Result<ModuleInfo, CompileErr> {
  const match_result = match(program, module_pattern);
  if (match_result === undefined) {
    // It failed to match
    return err("expected module form but it didn' match pattern");
  }
  const {
    module_name: [module_name_sexpr],
    module_path: [module_path_sexpr],
    body: [body_sexpr],
  } = match_result;
  // The way the pattern is written, they will always match exactly 1 thing
  // since there are no uses of star and stuff

  // Check if module path is a filename or a reference to a builtin module
  let module_path_is_builtin: boolean = false;
  let module_path_name: string = '';
  if (is_symbol(module_path_sexpr)) {
    module_path_is_builtin = true;
    module_path_name = val(module_path_sexpr);
  } else {
    module_path_is_builtin = false;
    const match_quoted_module_path_result = match(module_path_sexpr, quoted_module_path_pattern);
    if (match_quoted_module_path_result === undefined) {
      return err('module path format not supported. either use a symbol or a quoted symbol.');
    }
    const module_path_name_sexpr = match_quoted_module_path_result['module_path'][0]!;
    if (!is_symbol(module_path_name_sexpr)) {
      return err('module path format not supported. either use a symbol or a quoted symbol.');
    }
    module_path_name = val(module_path_name_sexpr);
  }

  // Check module name is symobl
  if (!is_symbol(module_name_sexpr)) {
    return err('module name should be a symbol');
  }
  const name = val(module_name_sexpr);

  return ok({
    name,
    module_path_is_builtin,
    module_path_name,
    module_body: body_sexpr,
  });
}

function compile_module_in_env(
  program_: SExpr,
  compile_env_: Environment
): Result<TopLevelForm, CompileErr> {
  throw 'Not yet implemented';
}

export const compile_module: CompileModule = (module_file) => {
  const module_sexpr_result = read(module_file.contents());
  if (isBadResult(module_sexpr_result)) {
    return module_sexpr_result;
  }
  const module_sexpr = module_sexpr_result.v;

  const module_info_result = get_module_info(module_sexpr);
  if (isBadResult(module_info_result)) {
    return module_info_result;
  }
  const module_info = module_info_result.v;

  const { module_path_is_builtin, module_path_name } = module_info;
  if (!module_path_is_builtin) {
    return err('recursively loading modules not supported yet, lmao. pls use a builtin module :)');
  }

  const parent_module_result = builtin_module_resolver.resolveBuiltinModule(module_path_name);
  if (isBadResult(parent_module_result)) {
    return err('could not load parent module');
  }
  const parent_module = parent_module_result.v;

  const env = parent_module.env;
  return compile_module_in_env(module_sexpr, env);
};
