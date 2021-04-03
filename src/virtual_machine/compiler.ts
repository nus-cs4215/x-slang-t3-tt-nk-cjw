import {
  Begin0Form,
  BeginForm,
  ExprForm,
  ExprOrDefineAst,
  LetForm,
  QuoteForm,
  VariableReferenceForm,
} from '../fep-types';
import { car, cdr, is_list, SExpr, SHomList, val } from '../sexpr';
import { homlist_to_arr } from '../sexpr/sexpr';
import { flatten_compiled_program_tree } from './utils';

export interface ProgramState {
  nameToNameId: Map<string, number>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
}

export type CompiledProgramTree = number | CompiledProgramTree[];

// OpCodes
const MAKE_CONST = 0; // followed by a <const id>
const POP_N = 1; // followed by n, number of things to pop
const ADD_BINDING = 2; // followed by a <name id>
const GET_ENV = 3; // followed by a <name id>

const get_opcode_names = (): string[] => {
  const names = [];
  names[MAKE_CONST] = 'MAKE_CONST';
  names[POP_N] = 'POP_N';
  names[ADD_BINDING] = 'ADD_BINDING';
  names[GET_ENV] = 'GET_ENV';
  return names;
};

const get_opcode_paramCounts = (): number[] => {
  const paramCounts = [];
  paramCounts[MAKE_CONST] = 1;
  paramCounts[POP_N] = 1;
  paramCounts[ADD_BINDING] = 1;
  paramCounts[GET_ENV] = 1;
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
): CompiledProgramTree[] => {
  const preFlattenedProgram = fep_to_bytecode_helper(program, programState);
  // ensures flattening only happens once at the end, avoiding quadratic runtime
  return flatten_compiled_program_tree(preFlattenedProgram);
};

const fep_to_bytecode_helper = (
  program: ExprOrDefineAst,
  programState: ProgramState,
  compiledProgramTree: CompiledProgramTree[] = []
): CompiledProgramTree[] => {
  const token_val = val(car(program));
  switch (token_val) {
    case 'quote': {
      const quoteprogram = program as QuoteForm;

      const quoteProgramTree: CompiledProgramTree[] = [];
      quoteProgramTree.push(MAKE_CONST);
      quoteProgramTree.push(programState.constIdToSExpr.length);

      const sexpr = car(cdr(quoteprogram));
      programState.constIdToSExpr.push(sexpr);

      compiledProgramTree.push(quoteProgramTree);
      return compiledProgramTree;
    }
    case 'begin0': {
      const begin0program = program as Begin0Form;

      let sequence: SHomList<ExprForm> = cdr(begin0program);
      let numExprs = 0;
      while (is_list(sequence)) {
        const expr = car(sequence);
        compiledProgramTree.push(fep_to_bytecode_helper(expr, programState));
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
        compiledProgramTree.push(fep_to_bytecode_helper(expr, programState));
      }
      compiledProgramTree.push(POP_N);
      compiledProgramTree.push(sequence.length - 1);

      compiledProgramTree.push(fep_to_bytecode_helper(sequence[sequence.length - 1], programState));

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
    case 'let': {
      const letprogram = program as LetForm;

      const binding_pairs = homlist_to_arr(car(cdr(letprogram)));
      // adding the exprs into the stack first
      for (let i = 0; i < binding_pairs.length; i++) {
        const binding_pair = binding_pairs[i];
        const expr = car(cdr(binding_pair));

        compiledProgramTree.push(fep_to_bytecode_helper(expr, programState));
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
        compiledProgramTree.push(fep_to_bytecode_helper(expr, programState));
      }
      compiledProgramTree.push(POP_N);
      compiledProgramTree.push(sequence.length - 1);

      compiledProgramTree.push(fep_to_bytecode_helper(sequence[sequence.length - 1], programState));
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

export const prettify_compiled_program = (compiledProgram: CompiledProgramTree[]): string[] => {
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
