import { ExprOrDefineAst, QuoteForm } from '../fep-types';
import { car, cdr, SExpr, val } from '../sexpr';
import { flatten_compiled_program_tree } from './utils';

export interface ProgramState {
  nameToNameId: Map<number, string>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
}

export type CompiledProgramTree = number | CompiledProgramTree[];

// OpCodes
const MAKE_CONST = 0; // followed by a <const id>

const get_opcode_names = (): string[] => {
  const names = [];
  names[MAKE_CONST] = 'MAKE_CONST';
  return names;
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
  const preFlattenedProgram = fep_to_bytecode_helper(program, programState, []);
  return flatten_compiled_program_tree(preFlattenedProgram);
};

const fep_to_bytecode_helper = (
  program: ExprOrDefineAst,
  programState: ProgramState,
  compiledProgramTree: CompiledProgramTree[]
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
    default: {
      console.log('Inside default');
      return compiledProgramTree;
    }
  }
};

export const prettify_compiled_program = (compiledProgram: CompiledProgramTree[]): string[] => {
  const opcodeNames = get_opcode_names();
  const prettified: string[] = [];
  for (let i = 0; i < compiledProgram.length; i++) {
    const opcode = compiledProgram[i];
    if (Array.isArray(opcode)) {
      prettified.push('EARLY TERMINATION. Compiled Program not flattened');
      return prettified;
    }

    // Has one thing behind it
    if (opcode === MAKE_CONST) {
      prettified.push(opcodeNames[opcode]);
      prettified.push(compiledProgram[++i].toString());
    } else {
      prettified.push(opcodeNames[opcode]);
    }
  }
  return prettified;
};
