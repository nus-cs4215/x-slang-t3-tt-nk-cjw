import { ExprOrDefineForm } from '../../fep-types';
import { read } from '../../reader';
import { sboolean, snumber, ssymbol } from '../../sexpr';
import { getOk } from '../../utils';
import {
  compile_fep_to_bytecode,
  make_program_state,
  prettify_compiled_program,
} from '../compiler';

test('compile quote', () => {
  const programState1 = make_program_state();
  expect(
    prettify_compiled_program(
      compile_fep_to_bytecode(getOk(read('(quote 1)')) as ExprOrDefineForm, programState1)
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
    ]
  `);
  expect(programState1.constIdToSExpr[0]).toEqual(snumber(1));

  const programState2 = make_program_state();
  expect(
    prettify_compiled_program(
      compile_fep_to_bytecode(getOk(read('(quote #t)')) as ExprOrDefineForm, programState2)
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
    ]
  `);
  expect(programState2.constIdToSExpr[0]).toEqual(sboolean(true));

  const programState3 = make_program_state();
  expect(
    prettify_compiled_program(
      compile_fep_to_bytecode(getOk(read('(quote a)')) as ExprOrDefineForm, programState3)
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
    ]
  `);
  expect(programState3.constIdToSExpr[0]).toEqual(ssymbol('a'));
});
