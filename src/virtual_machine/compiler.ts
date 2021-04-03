import { Begin0Form, BeginForm, ExprForm, ExprOrDefineAst, QuoteForm } from '../fep-types';
import { car, cdr, is_list, SExpr, SHomList, val } from '../sexpr';
import { homlist_to_arr } from '../sexpr/sexpr';
import { flatten_compiled_program_tree } from './utils';

export interface ProgramState {
  nameToNameId: Map<number, string>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
}

export type CompiledProgramTree = number | CompiledProgramTree[];

// OpCodes
const MAKE_CONST = 0; // followed by a <const id>
const POP = 1; // followed by n, number of things to pop

const get_opcode_names = (): string[] => {
  const names = [];
  names[MAKE_CONST] = 'MAKE_CONST';
  names[POP] = 'POP';
  return names;
};

const get_opcode_paramCounts = (): number[] => {
  const paramCounts = [];
  paramCounts[MAKE_CONST] = 1;
  paramCounts[POP] = 1;
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
      compiledProgramTree.push(POP);
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
      compiledProgramTree.push(POP);
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
