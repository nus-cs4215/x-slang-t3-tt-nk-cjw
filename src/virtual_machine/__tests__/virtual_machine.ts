import { make_empty_bindings, make_env, make_env_list } from '../../environment';
import { ExprOrDefineForm } from '../../fep-types';
import { primitives_module } from '../../modules';
import { read } from '../../reader';
import { sboolean, snumber, ssymbol } from '../../sexpr';
import { getOk, ok } from '../../utils/result';
import { compile_fep_to_bytecode, make_program_state } from '../compiler';
import { VirtualMachine } from '../virtual_machine';

const init_machine = (programString: string): VirtualMachine => {
  const the_global_environment = make_env_list(primitives_module.provides);
  const test_env = make_env(make_empty_bindings(), the_global_environment);
  const programState = make_program_state();
  const compiledProgram = compile_fep_to_bytecode(
    getOk(read(programString)) as ExprOrDefineForm,
    programState
  );
  return new VirtualMachine(compiledProgram, programState, test_env);
};

test('evaluate quote', () => {
  expect(init_machine(`(quote 1)`).run()).toEqual(ok(snumber(1)));
  expect(init_machine(`(quote #t)`).run()).toEqual(ok(sboolean(true)));
  expect(init_machine(`(quote a)`).run()).toEqual(ok(ssymbol('a')));
});
