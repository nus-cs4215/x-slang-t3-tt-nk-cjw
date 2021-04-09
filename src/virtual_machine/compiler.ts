import { compile } from '../compiler';
import {
  Begin0Form,
  BeginForm,
  DefineForm,
  DefineSyntaxForm,
  ExprForm,
  ExprOrDefineAst,
  IfForm,
  LetForm,
  QuoteForm,
  SetForm,
  VariableReferenceForm,
} from '../fep-types';
import { car, cdr, is_list, SExpr, SHomList, val } from '../sexpr';
import { homlist_to_arr } from '../sexpr/sexpr';

export interface ProgramState {
  nameToNameId: Map<string, number>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
}

export type CompiledProgram = number[];

// OpCodes
const MAKE_CONST = 0; // followed by a <const id>
const POP_N = 1; // followed by n, number of things to pop
const ADD_BINDING = 2; // followed by a <name id>
const GET_ENV = 3; // followed by a <name id>
const SET_ENV = 4; // followed by a <name id>
const MAKE_FUNC = 5; // followed by a <func id>
const JUMP_IF_FALSE = 6; // followed by absolute position
const JUMP = 7; // followed by absolute position
const ADD_BINDING_SYNTAX = 8; // followed by a <name id>
const EXTEND_ENV = 9;

const get_opcode_names = (): string[] => {
  const names = [];
  names[MAKE_CONST] = 'MAKE_CONST';
  names[POP_N] = 'POP_N';
  names[ADD_BINDING] = 'ADD_BINDING';
  names[GET_ENV] = 'GET_ENV';
  names[SET_ENV] = 'SET_ENV';
  names[MAKE_FUNC] = 'MAKE_FUNC';
  names[JUMP_IF_FALSE] = 'JUMP_IF_FALSE';
  names[JUMP] = 'JUMP';
  names[ADD_BINDING_SYNTAX] = 'ADD_BINDING_SYNTAX';
  names[EXTEND_ENV] = 'EXTEND_ENV';
  return names;
};

const get_opcode_paramCounts = (): number[] => {
  const paramCounts = [];
  paramCounts[MAKE_CONST] = 1;
  paramCounts[POP_N] = 1;
  paramCounts[ADD_BINDING] = 1;
  paramCounts[GET_ENV] = 1;
  paramCounts[SET_ENV] = 1;
  paramCounts[MAKE_FUNC] = 1;
  paramCounts[JUMP_IF_FALSE] = 1;
  paramCounts[JUMP] = 1;
  paramCounts[ADD_BINDING_SYNTAX] = 1;
  paramCounts[EXTEND_ENV] = 0;
  return paramCounts;
};

export const make_program_state = (): ProgramState => ({
  nameToNameId: new Map(),
  nameIdToName: [],
  constIdToSExpr: [],
});

export const compile_fep_to_bytecode = (
  program: ExprOrDefineAst,
  programState: ProgramState
): CompiledProgram => {
  return fep_to_bytecode_helper(program, programState);
};

const fep_to_bytecode_helper = (
  program: ExprOrDefineAst,
  programState: ProgramState,
  compiledProgramTree: CompiledProgram = []
): CompiledProgram => {
  const token_val = val(car(program));
  switch (token_val) {
    case 'quote': {
      const quoteprogram = program as QuoteForm;

      compiledProgramTree.push(MAKE_CONST);
      compiledProgramTree.push(programState.constIdToSExpr.length);

      const sexpr = car(cdr(quoteprogram));
      programState.constIdToSExpr.push(sexpr);

      return compiledProgramTree;
    }
    case 'begin0': {
      const begin0program = program as Begin0Form;

      let sequence: SHomList<ExprForm> = cdr(begin0program);
      let numExprs = 0;
      while (is_list(sequence)) {
        const expr = car(sequence);
        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
        sequence = cdr(sequence);
        numExprs++;
      }
      compiledProgramTree.push(POP_N);
      compiledProgramTree.push(numExprs - 1);

      return compiledProgramTree;
    }
    case 'begin': {
      const beginprogram = program as BeginForm;

      const sequence: ExprForm[] = homlist_to_arr(cdr(beginprogram));
      for (let i = 0; i < sequence.length - 1; i++) {
        const expr = sequence[i];
        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
      }
      compiledProgramTree.push(POP_N);
      compiledProgramTree.push(sequence.length - 1);

      fep_to_bytecode_helper(sequence[sequence.length - 1], programState, compiledProgramTree);

      return compiledProgramTree;
    }
    case 'define': {
      const defineprogram = program as DefineForm;
      const expr = car(cdr(cdr(defineprogram)));
      fep_to_bytecode_helper(expr, programState, compiledProgramTree);

      const symbol = car(cdr(defineprogram));
      const nameId = getNameId(val(symbol), programState);
      compiledProgramTree.push(ADD_BINDING);
      compiledProgramTree.push(nameId);

      return compiledProgramTree;
    }
    case 'define-syntax': {
      const definesyntax_program = program as DefineSyntaxForm;
      const expr = car(cdr(cdr(definesyntax_program)));
      fep_to_bytecode_helper(expr, programState, compiledProgramTree);

      const symbol = car(cdr(definesyntax_program));
      const nameId = getNameId(val(symbol), programState);
      compiledProgramTree.push(ADD_BINDING);
      compiledProgramTree.push(nameId);

      return compiledProgramTree;
    }
    case '#%variable-reference': {
      const variablereference_program = program as VariableReferenceForm;
      const symbol = car(cdr(variablereference_program));
      const nameId = getNameId(val(symbol), programState);

      compiledProgramTree.push(GET_ENV);
      compiledProgramTree.push(nameId);

      return compiledProgramTree;
    }
    case 'set!': {
      const set_program = program as SetForm;

      const expr = car(cdr(cdr(set_program)));
      fep_to_bytecode_helper(expr, programState, compiledProgramTree);

      const symbol = car(cdr(set_program));
      compiledProgramTree.push(SET_ENV);
      compiledProgramTree.push(getNameId(val(symbol), programState));
      return compiledProgramTree;
    }
    case 'let': {
      const letprogram = program as LetForm;
      compiledProgramTree.push(EXTEND_ENV);

      const binding_pairs = homlist_to_arr(car(cdr(letprogram)));
      // adding the exprs into the stack first
      for (let i = 0; i < binding_pairs.length; i++) {
        const binding_pair = binding_pairs[i];
        const expr = car(cdr(binding_pair));

        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
      }

      // adding instructions to bind the names on top of stack in reverse order
      for (let i = binding_pairs.length - 1; i >= 0; i--) {
        const binding_pair = binding_pairs[i];
        const symbol = car(binding_pair);

        const nameId = getNameId(val(symbol), programState);
        compiledProgramTree.push(ADD_BINDING);
        compiledProgramTree.push(nameId);
      }

      // evaluates the expr in the let body and return the last one
      const sequence: ExprForm[] = homlist_to_arr(cdr(cdr(letprogram)));
      for (let i = 0; i < sequence.length - 1; i++) {
        const expr = sequence[i];
        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
      }
      compiledProgramTree.push(POP_N);
      compiledProgramTree.push(sequence.length - 1);

      fep_to_bytecode_helper(sequence[sequence.length - 1], programState, compiledProgramTree);

      return compiledProgramTree;
    }
    case 'if': {
      const ifprogram = program as IfForm;
      const condition = car(cdr(ifprogram));
      const consequent = car(cdr(cdr(ifprogram)));
      const alternative = car(cdr(cdr(cdr(ifprogram))));

      const dummyPcPosition = -1; // must be replaced later

      fep_to_bytecode_helper(condition, programState, compiledProgramTree);

      compiledProgramTree.push(JUMP_IF_FALSE);
      const jumpIfFalseValueIdx = compiledProgramTree.length;
      compiledProgramTree.push(dummyPcPosition); // replace this with the start of alternative here

      fep_to_bytecode_helper(consequent, programState, compiledProgramTree);
      compiledProgramTree.push(JUMP);
      const jumpValueIdx = compiledProgramTree.length;
      compiledProgramTree.push(dummyPcPosition);

      // alternative is located at last idx after adding consequent and skipping 2 instructions (JUMP <JUMP POSITION>)
      compiledProgramTree[jumpIfFalseValueIdx] = compiledProgramTree.length;

      fep_to_bytecode_helper(alternative, programState, compiledProgramTree);
      // finish executing consequent, skip the entire alternative: last instruction and 1 more
      compiledProgramTree[jumpValueIdx] = compiledProgramTree.length;

      return compiledProgramTree;
    }
    default: {
      console.log('Inside default');
      return compiledProgramTree;
    }
  }
};

// allocates a new nameId if previously non-existent
const getNameId = (name: string, programState: ProgramState): number => {
  const nameId = programState.nameToNameId.get(name);
  if (nameId === undefined) {
    const allocatedNameId = programState.nameIdToName.length;

    programState.nameToNameId.set(name, allocatedNameId);
    programState.nameIdToName.push(name);
    return allocatedNameId;
  }

  return nameId;
};

export const prettify_compiled_program = (compiledProgram: CompiledProgram): string[] => {
  const opcodeNames = get_opcode_names();
  const paramCounts = get_opcode_paramCounts();
  const prettified: string[] = [];
  for (let i = 0; i < compiledProgram.length; i++) {
    const opcode = compiledProgram[i];
    if (Array.isArray(opcode)) {
      prettified.push('EARLY TERMINATION. Compiled Program not flattened');
      return prettified;
    }

    prettified.push(opcodeNames[opcode]); // push opcodes

    // push the n parameters behind it
    let paramCount = paramCounts[opcode];
    while (paramCount > 0) {
      prettified.push(compiledProgram[++i].toString());
      paramCount--;
    }
  }
  return prettified;
};
