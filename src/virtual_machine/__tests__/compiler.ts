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
      "POP_N",
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
      "POP_N",
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
      "POP_N",
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
      "POP_N",
      "1",
      "MAKE_CONST",
      "1",
    ]
  `);
  expect(programState2.constIdToSExpr).toEqual([snumber(1), sboolean(true)]);
});

test('compile #%variable-reference', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(getOk(read('(#%variable-reference x)')) as ExprOrDefineForm, programState1)
  ).toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
    ]
  `);
  expect(programState1.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
    }
  `);

  expect(
    compileAndPrettify(getOk(read('(#%variable-reference y)')) as ExprOrDefineForm, programState1)
  ).toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "1",
    ]
  `);
  expect(programState1.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
    }
  `);

  // should still be 0
  expect(
    compileAndPrettify(getOk(read('(#%variable-reference x)')) as ExprOrDefineForm, programState1)
  ).toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
    ]
  `);
  expect(programState1.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
    }
  `);

  expect(
    compileAndPrettify(getOk(read('(#%variable-reference z)')) as ExprOrDefineForm, programState1)
  ).toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "2",
    ]
  `);
  expect(programState1.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
      "z" => 2,
    }
  `);
});

test('compile let', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(read(`(let ([x (quote 1)]) (#%variable-reference x))`)) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "ADD_BINDING",
      "0",
      "POP_N",
      "0",
      "GET_ENV",
      "0",
    ]
  `);

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(let ([x (#%variable-reference y)]) (#%variable-reference x))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
      "ADD_BINDING",
      "1",
      "POP_N",
      "0",
      "GET_ENV",
      "1",
    ]
  `);

  const programState3 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(
          `(let ([x (quote 2)] [y (quote 3)] [z (quote 4)] [a (quote 5)]) (#%variable-reference y))`
        )
      ) as ExprOrDefineForm,
      programState3
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "MAKE_CONST",
      "2",
      "MAKE_CONST",
      "3",
      "ADD_BINDING",
      "0",
      "ADD_BINDING",
      "1",
      "ADD_BINDING",
      "2",
      "ADD_BINDING",
      "3",
      "POP_N",
      "0",
      "GET_ENV",
      "2",
    ]
  `);
  // start assigning the names in reverse order
  expect(programState3.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "a" => 0,
      "z" => 1,
      "y" => 2,
      "x" => 3,
    }
  `);

  const programState4 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(let ([x (quote 2)] [y (#%variable-reference x)]) (#%variable-reference y))`)
      ) as ExprOrDefineForm,
      programState4
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "GET_ENV",
      "0",
      "ADD_BINDING",
      "1",
      "ADD_BINDING",
      "0",
      "POP_N",
      "0",
      "GET_ENV",
      "1",
    ]
  `);
  expect(programState4.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
    }
  `);

  const programState5 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(
          `(let ([x (quote 2)] [y (quote 3)] [z (quote 4)] [a (quote 5)]) (#%variable-reference y) (#%variable-reference a))`
        )
      ) as ExprOrDefineForm,
      programState5
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "MAKE_CONST",
      "2",
      "MAKE_CONST",
      "3",
      "ADD_BINDING",
      "0",
      "ADD_BINDING",
      "1",
      "ADD_BINDING",
      "2",
      "ADD_BINDING",
      "3",
      "GET_ENV",
      "2",
      "POP_N",
      "1",
      "GET_ENV",
      "0",
    ]
  `);
  // starts assigning the name in reverse order
  expect(programState5.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "a" => 0,
      "z" => 1,
      "y" => 2,
      "x" => 3,
    }
  `);
});

test('compile set!', () => {
  const programState1 = make_program_state();
  expect(compileAndPrettify(getOk(read(`(set! x (quote 1))`)) as ExprOrDefineForm, programState1))
    .toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "SET_ENV",
      "0",
    ]
  `);
  expect(programState1.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
    }
  `);

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(let ([x (quote 1)]) (set! x (quote 2)) (#%variable-reference x))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "ADD_BINDING",
      "0",
      "MAKE_CONST",
      "1",
      "SET_ENV",
      "0",
      "POP_N",
      "1",
      "GET_ENV",
      "0",
    ]
  `);
  expect(programState2.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
    }
  `);
});
