import { make_vm_closure, VMClosure } from '../evaluator/datatypes';
import {
  Begin0Form,
  BeginForm,
  DefineForm,
  DefineSyntaxForm,
  ExprForm,
  ExprOrDefineAst,
  IfForm,
  LetForm,
  LetrecForm,
  PlainAppForm,
  PlainLambdaForm,
  QuoteForm,
  SetForm,
  VariableReferenceForm,
} from '../fep-types';
import { car, cdr, is_list, SExpr, SHomList, val } from '../sexpr';
import { homlist_to_arr, is_nil } from '../sexpr/sexpr';
import {
  ADD_BINDING,
  ADD_BINDING_SYNTAX,
  ADD_BINDING_UNDEFINED,
  CALL,
  END_SCOPE,
  EXTEND_ENV,
  GET_ENV,
  JUMP,
  JUMP_IF_FALSE,
  MAKE_CONST,
  MAKE_FUNC,
  POP_N,
  SET_ENV,
} from './opcodes';

export interface ProgramState {
  nameToNameId: Map<string, number>;
  nameIdToName: string[];
  constIdToSExpr: SExpr[];
  closureIdToClosure: VMClosure[];
  topLevelClosure: VMClosure | undefined; // could be part of the array but I separate it to be clearer
}

export type CompiledProgram = number[];

export const make_program_state = (): ProgramState => ({
  nameToNameId: new Map(),
  nameIdToName: [],
  constIdToSExpr: [],
  closureIdToClosure: [],
  topLevelClosure: undefined,
});

export const compile_fep_to_bytecode = (
  program: ExprOrDefineAst,
  programState: ProgramState
): CompiledProgram => {
  const topLevelProgram = fep_to_bytecode_helper(program, programState);
  const topLevelClosure = make_vm_closure([], -1, undefined, topLevelProgram);
  programState.topLevelClosure = topLevelClosure;
  return topLevelProgram;
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
      compiledProgramTree.push(ADD_BINDING_SYNTAX);
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

      const binding_pairs = homlist_to_arr(car(cdr(letprogram)));
      // adding the exprs into the stack first
      for (let i = 0; i < binding_pairs.length; i++) {
        const binding_pair = binding_pairs[i];
        const expr = car(cdr(binding_pair));

        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
      }

      compiledProgramTree.push(EXTEND_ENV);

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
      compiledProgramTree.push(END_SCOPE);

      return compiledProgramTree;
    }
    case 'letrec': {
      const letrecprogram = program as LetrecForm;
      compiledProgramTree.push(EXTEND_ENV);

      const binding_pairs = homlist_to_arr(car(cdr(letrecprogram)));
      // add undefined binding first
      for (let i = 0; i < binding_pairs.length; i++) {
        const binding_pair = binding_pairs[i];
        const symbol = car(binding_pair);

        const nameId = getNameId(val(symbol), programState);
        compiledProgramTree.push(ADD_BINDING_UNDEFINED);
        compiledProgramTree.push(nameId);
      }

      // evaluate expr one by one
      for (let i = 0; i < binding_pairs.length; i++) {
        const binding_pair = binding_pairs[i];
        const expr = car(cdr(binding_pair));
        fep_to_bytecode_helper(expr, programState, compiledProgramTree);

        const symbol = car(binding_pair);
        const nameId = getNameId(val(symbol), programState);
        // not SET_ENV because SET_ENV will error when we try to set
        // to an undefined value
        compiledProgramTree.push(ADD_BINDING);
        compiledProgramTree.push(nameId);
      }

      // evaluates the expr in the let body and return the last one
      const sequence: ExprForm[] = homlist_to_arr(cdr(cdr(letrecprogram)));
      for (let i = 0; i < sequence.length - 1; i++) {
        const expr = sequence[i];
        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
      }
      compiledProgramTree.push(POP_N);
      compiledProgramTree.push(sequence.length - 1);

      fep_to_bytecode_helper(sequence[sequence.length - 1], programState, compiledProgramTree);
      compiledProgramTree.push(END_SCOPE);

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
    case '#%plain-lambda': {
      const plainlambda_program = program as PlainLambdaForm;
      let unparsed_formals = car(cdr(plainlambda_program));
      const uncompiled_body = homlist_to_arr(cdr(cdr(plainlambda_program)));

      // compile formals and the rest
      const formals: number[] = [];
      while (is_list(unparsed_formals)) {
        const formal = val(car(unparsed_formals));
        formals.push(getNameId(formal, programState));
        unparsed_formals = cdr(unparsed_formals);
      }

      let rest: number | undefined;
      if (is_nil(unparsed_formals)) {
        rest = undefined;
      } else {
        rest = getNameId(val(unparsed_formals), programState);
      }

      // compile body
      const body: CompiledProgram = [];
      for (const expr of uncompiled_body) {
        fep_to_bytecode_helper(expr, programState, body);
      }

      const closureId = programState.closureIdToClosure.length;
      const closure = make_vm_closure(formals, closureId, rest, body);
      compiledProgramTree.push(MAKE_FUNC);
      compiledProgramTree.push(closureId);
      programState.closureIdToClosure.push(closure);
      return compiledProgramTree;
    }
    case '#%plain-app': {
      const plainapp_program = program as PlainAppForm;
      const exprs = homlist_to_arr(cdr(plainapp_program));

      for (const expr of exprs) {
        fep_to_bytecode_helper(expr, programState, compiledProgramTree);
      }
      compiledProgramTree.push(CALL);
      // the length of exprs include the function expression, hence - 1
      compiledProgramTree.push(exprs.length - 1);
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
