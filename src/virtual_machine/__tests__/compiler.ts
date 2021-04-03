import { ExprOrDefineAst, ExprOrDefineForm } from '../../fep-types';
import { read } from '../../reader';
import { sboolean, snumber, ssymbol } from '../../sexpr';
import { getOk } from '../../utils';
import {
  compile_fep_to_bytecode,
  make_program_state,
  prettify_compiled_program,
  ProgramState,
} from '../compiler';

const compileAndPrettify = (program: ExprOrDefineAst, programState: ProgramState): string[] => {
  return prettify_compiled_program(compile_fep_to_bytecode(program, programState));
};

test('compile quote', () => {
  const programState1 = make_program_state();
  expect(compileAndPrettify(getOk(read('(quote 1)')) as ExprOrDefineForm, programState1))
    .toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
    ]
  `);
  expect(programState1.constIdToSExpr[0]).toEqual(snumber(1));

  const programState2 = make_program_state();
  expect(compileAndPrettify(getOk(read('(quote #t)')) as ExprOrDefineForm, programState2))
    .toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
    ]
  `);
  expect(programState2.constIdToSExpr[0]).toEqual(sboolean(true));

  const programState3 = make_program_state();
  expect(compileAndPrettify(getOk(read('(quote a)')) as ExprOrDefineForm, programState3))
    .toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
    ]
  `);
  expect(programState3.constIdToSExpr[0]).toEqual(ssymbol('a'));
});

test('compile begin0', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(begin0
            (quote a)
            (quote b)
            (quote c))`)
      ) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "MAKE_CONST",
      "2",
      "POP",
      "2",
    ]
  `);
  expect(programState1.constIdToSExpr).toEqual([ssymbol('a'), ssymbol('b'), ssymbol('c')]);

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(begin0
            (quote 1)
            (quote #t))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "POP",
      "1",
    ]
  `);
  expect(programState2.constIdToSExpr).toEqual([snumber(1), sboolean(true)]);
});

test('compile begin', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(begin
            (quote a)
            (quote b)
            (quote c))`)
      ) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "POP",
      "2",
      "MAKE_CONST",
      "2",
    ]
  `);
  expect(programState1.constIdToSExpr).toEqual([ssymbol('a'), ssymbol('b'), ssymbol('c')]);

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(begin
            (quote 1)
            (quote #t))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "POP",
      "1",
      "MAKE_CONST",
      "1",
    ]
  `);
  expect(programState2.constIdToSExpr).toEqual([snumber(1), sboolean(true)]);
});
