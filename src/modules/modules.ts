import { Bindings } from '../environment';
import { json_star, json_var, match } from '../pattern';
import { print } from '../printer';
import { is_symbol, jsonRead, SExpr, val } from '../sexpr';
import { err, ok, Result } from '../utils';

type ModuleName = string;
type FileName = string;

// A module is basically a bunch of variables and syntaxes
// that we can add to our environment
export interface Module {
  name: ModuleName;
  filename: FileName;
  provides: Bindings;
}

const module_pattern = jsonRead([
  'module',
  json_var('module_name'),
  json_var('module_path'),
  '.',
  json_star(json_var('body'), []),
]);
const quoted_module_path_pattern = jsonRead(['quote', json_var('module_path')]);
interface ModuleInfo {
  name: string;
  // true means the module_path matches (quote ...)
  module_path_is_builtin: boolean;
  module_path_name: string;
  module_body: SExpr[];
}

export function get_module_info(program: SExpr): Result<ModuleInfo, string> {
  const match_result = match(program, module_pattern);
  if (match_result === undefined) {
    // It failed to match
    return err("expected module form but it didn't match pattern: " + print(program));
  }
  const {
    module_name: [module_name_sexpr],
    module_path: [module_path_sexpr],
    body: module_body_or_undefined,
  } = match_result;
  const module_body = module_body_or_undefined === undefined ? [] : module_body_or_undefined;

  // The way the pattern is written, they will always match exactly 1 thing
  // since there are no uses of star and stuff

  // Check if module path is a filename or a reference to a builtin module
  let module_path_is_builtin: boolean = false;
  let module_path_name: string = '';
  if (is_symbol(module_path_sexpr)) {
    module_path_is_builtin = false;
    module_path_name = val(module_path_sexpr);
  } else {
    module_path_is_builtin = true;
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
    module_body,
  });
}
