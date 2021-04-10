import { ExprOrDefineAst, ExprOrDefineForm } from '../../fep-types';
import { read } from '../../reader';
import { sboolean, snumber, ssymbol } from '../../sexpr';
import { getOk } from '../../utils';
import { compile_fep_to_bytecode, make_program_state, ProgramState } from '../compiler';
import { prettify_compiled_program } from '../utils';

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
      "EXTEND_ENV",
      "MAKE_CONST",
      "0",
      "ADD_BINDING",
      "0",
      "POP_N",
      "0",
      "GET_ENV",
      "0",
      "END_SCOPE",
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
      "EXTEND_ENV",
      "GET_ENV",
      "0",
      "ADD_BINDING",
      "1",
      "POP_N",
      "0",
      "GET_ENV",
      "1",
      "END_SCOPE",
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
      "EXTEND_ENV",
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
      "END_SCOPE",
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
      "EXTEND_ENV",
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
      "END_SCOPE",
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
      "EXTEND_ENV",
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
      "END_SCOPE",
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

test('compile letrec', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(read(`(letrec ([x (quote 1)]) (#%variable-reference x))`)) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "EXTEND_ENV",
      "ADD_BINDING_UNDEFINED",
      "0",
      "MAKE_CONST",
      "0",
      "SET_ENV",
      "0",
      "POP_N",
      "0",
      "GET_ENV",
      "0",
      "END_SCOPE",
    ]
  `);

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(letrec ([x (#%variable-reference y)]) (#%variable-reference x))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "EXTEND_ENV",
      "ADD_BINDING_UNDEFINED",
      "0",
      "GET_ENV",
      "1",
      "SET_ENV",
      "0",
      "POP_N",
      "0",
      "GET_ENV",
      "0",
      "END_SCOPE",
    ]
  `);

  const programState3 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(
          `(letrec ([x (quote 2)] [y (quote 3)] [z (quote 4)] [a (quote 5)]) (#%variable-reference y))`
        )
      ) as ExprOrDefineForm,
      programState3
    )
  ).toMatchInlineSnapshot(`
    Array [
      "EXTEND_ENV",
      "ADD_BINDING_UNDEFINED",
      "0",
      "ADD_BINDING_UNDEFINED",
      "1",
      "ADD_BINDING_UNDEFINED",
      "2",
      "ADD_BINDING_UNDEFINED",
      "3",
      "MAKE_CONST",
      "0",
      "SET_ENV",
      "0",
      "MAKE_CONST",
      "1",
      "SET_ENV",
      "1",
      "MAKE_CONST",
      "2",
      "SET_ENV",
      "2",
      "MAKE_CONST",
      "3",
      "SET_ENV",
      "3",
      "POP_N",
      "0",
      "GET_ENV",
      "1",
      "END_SCOPE",
    ]
  `);
  // start assigning the names in reverse order
  expect(programState3.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
      "z" => 2,
      "a" => 3,
    }
  `);

  const programState4 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(letrec ([x (quote 2)] [y (#%variable-reference x)]) (#%variable-reference y))`)
      ) as ExprOrDefineForm,
      programState4
    )
  ).toMatchInlineSnapshot(`
    Array [
      "EXTEND_ENV",
      "ADD_BINDING_UNDEFINED",
      "0",
      "ADD_BINDING_UNDEFINED",
      "1",
      "MAKE_CONST",
      "0",
      "SET_ENV",
      "0",
      "GET_ENV",
      "0",
      "SET_ENV",
      "1",
      "POP_N",
      "0",
      "GET_ENV",
      "1",
      "END_SCOPE",
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
          `(letrec ([x (quote 2)] [y (quote 3)] [z (quote 4)] [a (quote 5)]) (#%variable-reference y) (#%variable-reference a))`
        )
      ) as ExprOrDefineForm,
      programState5
    )
  ).toMatchInlineSnapshot(`
    Array [
      "EXTEND_ENV",
      "ADD_BINDING_UNDEFINED",
      "0",
      "ADD_BINDING_UNDEFINED",
      "1",
      "ADD_BINDING_UNDEFINED",
      "2",
      "ADD_BINDING_UNDEFINED",
      "3",
      "MAKE_CONST",
      "0",
      "SET_ENV",
      "0",
      "MAKE_CONST",
      "1",
      "SET_ENV",
      "1",
      "MAKE_CONST",
      "2",
      "SET_ENV",
      "2",
      "MAKE_CONST",
      "3",
      "SET_ENV",
      "3",
      "GET_ENV",
      "1",
      "POP_N",
      "1",
      "GET_ENV",
      "3",
      "END_SCOPE",
    ]
  `);
  expect(programState5.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
      "z" => 2,
      "a" => 3,
    }
  `);

  const programState6 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(
          `(letrec ([x (#%variable-reference y)]
                    [y (#%variable-reference x)])
            (#%variable-reference y))`
        )
      ) as ExprOrDefineForm,
      programState6
    )
  ).toMatchInlineSnapshot(`
    Array [
      "EXTEND_ENV",
      "ADD_BINDING_UNDEFINED",
      "0",
      "ADD_BINDING_UNDEFINED",
      "1",
      "GET_ENV",
      "1",
      "SET_ENV",
      "0",
      "GET_ENV",
      "0",
      "SET_ENV",
      "1",
      "POP_N",
      "0",
      "GET_ENV",
      "1",
      "END_SCOPE",
    ]
  `);
  expect(programState6.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
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
      "EXTEND_ENV",
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
      "END_SCOPE",
    ]
  `);
  expect(programState2.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
    }
  `);
});

test('compile if', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(read(`(if (quote #t) (quote 1) (quote 2))`)) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "JUMP_IF_FALSE",
      "8",
      "MAKE_CONST",
      "1",
      "JUMP",
      "10",
      "MAKE_CONST",
      "2",
    ]
  `);
  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(if (quote #t)
                  (quote a)
                  (if (quote #t)
                      (quote b)
                      (quote c)))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "JUMP_IF_FALSE",
      "8",
      "MAKE_CONST",
      "1",
      "JUMP",
      "18",
      "MAKE_CONST",
      "2",
      "JUMP_IF_FALSE",
      "16",
      "MAKE_CONST",
      "3",
      "JUMP",
      "18",
      "MAKE_CONST",
      "4",
    ]
  `);

  const programState3 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(if (quote #t)
                  (if (quote #t)
                      (quote a)
                      (quote b))
                  (quote c))`)
      ) as ExprOrDefineForm,
      programState3
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "JUMP_IF_FALSE",
      "16",
      "MAKE_CONST",
      "1",
      "JUMP_IF_FALSE",
      "12",
      "MAKE_CONST",
      "2",
      "JUMP",
      "14",
      "MAKE_CONST",
      "3",
      "JUMP",
      "18",
      "MAKE_CONST",
      "4",
    ]
  `);
});

test('compile define', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(getOk(read(`(define x (quote 10))`)) as ExprOrDefineForm, programState1)
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_CONST",
      "0",
      "ADD_BINDING",
      "0",
    ]
  `);
});

test('compile #%plain-lambda', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(read(`(#%plain-lambda (x) (#%variable-reference x))`)) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
    ]
  `);
  expect(prettify_compiled_program(programState1.closureIdToClosure[0].body))
    .toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
    ]
  `);
  expect(programState1.closureIdToClosure[0].formals).toMatchInlineSnapshot(`
    Array [
      0,
    ]
  `);
  expect(programState1.closureIdToClosure[0].rest).toMatchInlineSnapshot(`undefined`);
  // ---

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(read(`(#%plain-lambda x (#%variable-reference x))`)) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
    ]
  `);
  expect(prettify_compiled_program(programState2.closureIdToClosure[0].body))
    .toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
    ]
  `);
  expect(programState2.closureIdToClosure[0].formals).toMatchInlineSnapshot(`Array []`);
  expect(programState2.closureIdToClosure[0].rest).toMatchInlineSnapshot(`0`);

  // ---

  const programState3 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(read(`(#%plain-lambda (x y . z) (#%variable-reference x))`)) as ExprOrDefineForm,
      programState3
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
    ]
  `);
  expect(prettify_compiled_program(programState3.closureIdToClosure[0].body))
    .toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
    ]
  `);
  expect(programState3.closureIdToClosure[0].formals).toMatchInlineSnapshot(`
    Array [
      0,
      1,
    ]
  `);
  expect(programState3.closureIdToClosure[0].rest).toMatchInlineSnapshot(`2`);
  expect(programState3.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "x" => 0,
      "y" => 1,
      "z" => 2,
    }
  `);
});

test('compiler #%plain-app', () => {
  const programState1 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(#%plain-app (#%plain-lambda (x) (#%variable-reference x)) (quote 1))`)
      ) as ExprOrDefineForm,
      programState1
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
      "MAKE_CONST",
      "0",
      "CALL",
      "1",
    ]
  `);

  const programState2 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(#%plain-app (#%plain-lambda (x . y) (#%variable-reference y)) (quote 1) (quote 2))`)
      ) as ExprOrDefineForm,
      programState2
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "CALL",
      "2",
    ]
  `);

  const programState3 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(
          `(#%plain-app (#%plain-lambda (x . y) (#%variable-reference y)) (quote 1) (quote 2) (quote 3))`
        )
      ) as ExprOrDefineForm,
      programState3
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
      "MAKE_CONST",
      "0",
      "MAKE_CONST",
      "1",
      "MAKE_CONST",
      "2",
      "CALL",
      "3",
    ]
  `);

  const programState4 = make_program_state();
  expect(
    compileAndPrettify(
      getOk(
        read(`(#%plain-app 
                (#%plain-lambda
                  (f x)
                  (#%plain-app (#%variable-reference f) (#%variable-reference x)))
                (#%plain-lambda (y) (#%variable-reference y))
                (quote 100))`)
      ) as ExprOrDefineForm,
      programState4
    )
  ).toMatchInlineSnapshot(`
    Array [
      "MAKE_FUNC",
      "0",
      "MAKE_FUNC",
      "1",
      "MAKE_CONST",
      "0",
      "CALL",
      "2",
    ]
  `);
  expect(programState4.nameToNameId).toMatchInlineSnapshot(`
    Map {
      "f" => 0,
      "x" => 1,
      "y" => 2,
    }
  `);
  // the first lambda
  expect(programState4.closureIdToClosure[0].formals).toMatchInlineSnapshot(`
    Array [
      0,
      1,
    ]
  `);
  expect(programState4.closureIdToClosure[0].rest).toMatchInlineSnapshot(`undefined`);
  expect(prettify_compiled_program(programState4.closureIdToClosure[0].body))
    .toMatchInlineSnapshot(`
    Array [
      "GET_ENV",
      "0",
      "GET_ENV",
      "1",
      "CALL",
      "1",
    ]
  `);
});
