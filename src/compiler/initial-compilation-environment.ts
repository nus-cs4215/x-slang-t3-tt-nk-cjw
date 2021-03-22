import { Bindings, Environment, make_bindings_from_record, make_env_list } from '../environment';
import { make_error_core_transformer } from './error-core-transformer';
import { module_core_transformer } from './module-core-transformer';

// NOTE: We use nullary functions here because
// we reference a function in a module that may
// have a cyclic dependency and i rather not
// figure out how or whether javascript handles this
export const make_initial_compilation_bindings = (): Bindings =>
  make_bindings_from_record(
    {},
    {},
    {
      module: module_core_transformer,
      '#%plain-module-begin': make_error_core_transformer(
        '#%plain-module-begin must occur in module-begin context'
      ),
    }
  );
export const make_initial_compilation_environment = (): Environment =>
  make_env_list(make_initial_compilation_bindings());
