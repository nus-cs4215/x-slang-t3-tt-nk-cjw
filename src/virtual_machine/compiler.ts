import { ExprOrDefineAst } from '../fep-types';
import { SExpr } from '../sexpr';

export interface ProgramState {
  nameToNameId: Map<number, string>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
}

export type CompiledProgramTree = number | CompiledProgramTree[];

export const make_program_state = (): ProgramState => ({
  nameToNameId: new Map(),
  nameIdToName: [],
  constIdToSExpr: [],
});

export const compile_fep_to_bytecode = (
  program: ExprOrDefineAst,
  programState: ProgramState
): CompiledProgramTree => {
  return fep_to_bytecode_helper(program, programState, []);
};

const fep_to_bytecode_helper = (
  program: ExprOrDefineAst,
  programState: ProgramState,
  compiledProgramTree: CompiledProgramTree
): CompiledProgramTree => {
  console.log(programState);
  console.log(program);

  return compiledProgramTree;
};
