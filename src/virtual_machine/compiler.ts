import { ExprOrDefineAst, QuoteForm } from '../fep-types';
import { car, cdr, SExpr, val } from '../sexpr';

export interface ProgramState {
  nameToNameId: Map<number, string>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
}

export type CompiledProgramTree = number | CompiledProgramTree[];

// OpCodes
const MAKE_CONST = 0; // followed by a <const id>

export const make_program_state = (): ProgramState => ({
  nameToNameId: new Map(),
  nameIdToName: [],
  constIdToSExpr: [],
});

export const compile_fep_to_bytecode = (
  program: ExprOrDefineAst,
  programState: ProgramState
): CompiledProgramTree[] => {
  return fep_to_bytecode_helper(program, programState, []);
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
      return compiledProgramTree;
    }
    default: {
      console.log('Inside default');
      return compiledProgramTree;
    }
  }
};

export const flatten_compiled_program_tree = (
  tree: CompiledProgramTree,
  flat: CompiledProgramTree[] = []
): CompiledProgramTree[] => {
  if (Array.isArray(tree)) {
    for (const child of tree) {
      flatten_compiled_program_tree(child, flat);
    }
  } else {
    flat.push(tree);
  }
  return flat;
};
