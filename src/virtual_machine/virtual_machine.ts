import { Environment, set_define } from '../environment';
import {
  Bindings,
  BindingType,
  define_binding,
  find_env,
  get_binding,
  make_empty_bindings,
  make_env,
  set_binding,
} from '../environment/environment';
import { EvalDataType } from '../evaluator/datatypes';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { is_boolean, val } from '../sexpr';
import { sbox, is_boxed, SExprT, snil, scons } from '../sexpr/sexpr';
import { ok, err, getOk, isBadResult } from '../utils/result';
import { CompiledProgram, ProgramState } from './compiler';
import {
  MAKE_CONST,
  ADD_BINDING,
  GET_ENV,
  POP_N,
  SET_ENV,
  JUMP,
  JUMP_IF_FALSE,
  EXTEND_ENV,
  END_SCOPE,
  ADD_BINDING_UNDEFINED,
  MAKE_FUNC,
  CALL,
} from './opcodes';

type Microcode = (vm: VirtualMachine) => void;
const M: Microcode[] = [];
M[MAKE_CONST] = (vm: VirtualMachine) => {
  const id = vm.P[vm.PC + 1];
  const sexpr = vm.programState.constIdToSExpr[id];
  vm.OS.push(ok(sexpr));
  vm.PC += 2;
};

M[MAKE_FUNC] = (vm: VirtualMachine) => {
  const id = vm.P[vm.PC + 1];
  const vmClosure = vm.programState.closureIdToClosure[id];
  vm.OS.push(ok(sbox(vmClosure)));
  vm.PC += 2;
};

M[POP_N] = (vm: VirtualMachine) => {
  const n = vm.P[vm.PC + 1];
  for (let i = 0; i < n; i++) {
    vm.OS.pop();
  }

  vm.PC += 2;
};

M[ADD_BINDING] = (vm: VirtualMachine) => {
  const sexpr = vm.OS[vm.OS.length - 1]; // stays on top of the stack
  if (sexpr === undefined) {
    console.error(`ADD_BINDING: found an empty operand stack`);
    return;
  }
  const nameId = vm.P[vm.PC + 1];
  const name = vm.getName(nameId);

  set_define(vm.env!.bindings, name, getOk(sexpr));

  vm.PC += 2;
};

M[ADD_BINDING_UNDEFINED] = (vm: VirtualMachine) => {
  const nameId = vm.P[vm.PC + 1];
  const name = vm.getName(nameId);

  set_define(vm.env!.bindings, name, undefined);

  vm.PC += 2;
};

M[GET_ENV] = (vm: VirtualMachine) => {
  const nameId = vm.P[vm.PC + 1];
  const name = vm.getName(nameId);

  const found_env = find_env(name, vm.env);
  if (found_env === undefined) {
    console.error(`GET_ENV: could not find variable ${name}`);
    return;
  }

  const binding = get_binding(found_env.bindings, name)!;
  if (binding._type !== BindingType.Define || binding.val === undefined) {
    console.error(`GET_ENV: tried to use variable ${name} before initialization`);
    return;
  }

  vm.OS.push(ok(binding.val as EvalSExpr));
  vm.PC += 2;
};

M[SET_ENV] = (vm: VirtualMachine) => {
  const sexpr = vm.OS[vm.OS.length - 1]; // stays on top of the stack
  if (sexpr === undefined) {
    console.error(`SET_ENV: found an empty operand stack`);
    return;
  }
  const nameId = vm.P[vm.PC + 1];
  const name = vm.getName(nameId);

  const found_env = find_env(name, vm.env);
  if (found_env === undefined) {
    console.error(
      `SET_ENV: assignment disallowed; cannot set variable ${name} before its definition`
    );
    return;
  }

  const binding = get_binding(found_env.bindings, name)!;
  if (binding._type !== BindingType.Define || binding.val === undefined) {
    console.error(`SET_ENV: tried to set variable ${name} before initialization`);
    return;
  }
  const new_binding = define_binding(getOk(sexpr));
  set_binding(found_env.bindings, name, new_binding);

  vm.PC += 2;
};

M[JUMP] = (vm: VirtualMachine) => {
  vm.PC = vm.P[vm.PC + 1];
};

M[JUMP_IF_FALSE] = (vm: VirtualMachine) => {
  const sexpr = vm.OS.pop();
  if (sexpr === undefined) {
    console.error('JUMP_IF_FALSE: found an emmpty operand stack');
    return;
  }

  if (isBadResult(sexpr)) {
    console.error(`JUMP_IF_FALSE: bad result found: ${sexpr.v}`);
    return;
  }

  if (!(is_boolean(sexpr.v) && val(sexpr.v) === false)) {
    vm.PC = vm.PC + 2;
  } else {
    // jump, since it is false
    vm.PC = vm.P[vm.PC + 1];
  }
};

M[EXTEND_ENV] = (vm: VirtualMachine) => {
  vm.env = make_env(make_empty_bindings(), vm.env);
  vm.PC += 1;
};

M[END_SCOPE] = (vm: VirtualMachine) => {
  vm.env = vm.env?.parent;
  vm.PC += 1;
};

M[CALL] = (vm: VirtualMachine) => {
  // vm.PC + 2 as we want it to resume from there
  const stackFrame = make_stack_frame(vm.env, vm.closureId, vm.PC + 2, vm.OS);

  const noOfArgs = vm.P[vm.PC + 1];
  const wrappedClosure = getOk(vm.OS[vm.OS.length - 1 - noOfArgs]); // peek the OS
  const args: EvalResult[] = [];
  for (let i = 0; i < noOfArgs; i++) {
    args.push(vm.OS.pop()!);
  }
  // args is in reverse order, since the one on top of the OS is the nth item
  args.reverse();
  vm.OS.pop(); // don't need the closure anymore

  if (is_boxed(wrappedClosure)) {
    const closure = wrappedClosure.val;
    if (closure.variant === EvalDataType.VMClosure) {
      // do error checking here which is not implemented
      const bindings: Bindings = make_empty_bindings();
      for (let i = 0; i < closure.formals.length; i++) {
        set_define(bindings, vm.getName(closure.formals[i]), getOk(args[i]));
      }
      let rest_args: SExprT<unknown> = snil();
      for (let i = args.length - 1; i > closure.formals.length - 1; i--) {
        rest_args = scons(getOk(args[i]), rest_args);
      }

      if (closure.rest !== undefined) {
        set_define(bindings, vm.getName(closure.rest), rest_args);
      }
      vm.env = make_env(bindings, vm.env);
      vm.OS = [];
      vm.PC = 0;
      vm.closureId = closure.closureId;
      vm.P = vm.programState.closureIdToClosure[vm.closureId].body;
    } else if (closure.variant === EvalDataType.Primitive) {
      // closure is a primitive
      console.error('eval data type is primitive');
    }
  }

  vm.RTS.push(stackFrame);
};

export interface StackFrame {
  env: Environment;
  closureId: number;
  PC: number;
  OS: EvalResult[];
}

const make_stack_frame = (
  env: Environment,
  closureId: number,
  PC: number,
  OS: EvalResult[] = []
): StackFrame => ({
  env,
  closureId,
  PC,
  OS,
});

export class VirtualMachine {
  P: CompiledProgram;
  programState: ProgramState;
  OS: EvalResult[];
  env: Environment;
  closureId: number;
  PC: number;
  RTS: StackFrame[];

  constructor(
    P: CompiledProgram,
    programState: ProgramState,
    env: Environment,
    OS: EvalResult[] = [],
    closureId: number = -1, // denotes top level closure
    PC: number = 0,
    RTS: StackFrame[] = []
  ) {
    this.P = P;
    this.programState = programState;
    this.OS = OS;
    this.env = env;
    this.closureId = closureId;
    this.PC = PC;
    this.RTS = RTS;
  }

  getName(nameId: number): string {
    return this.programState.nameIdToName[nameId];
  }

  run(): EvalResult {
    for (;;) {
      // set compiled program based on closure ID
      if (this.closureId === -1) {
        this.P = this.programState.topLevelClosure!.body;
      } else {
        this.P = this.programState.closureIdToClosure[this.closureId].body;
      }

      // main runner
      while (this.PC < this.P.length) {
        M[this.P[this.PC]](this);
      }

      // after done with this closure, pop to return to previous closure
      const stackFrameTop = this.RTS.pop();
      if (stackFrameTop === undefined) {
        // no more closure signals end of the program
        break;
      }

      // else, restore the stack frame
      const currTop = this.OS.pop()!; // closures should always return smth at the end
      this.env = stackFrameTop.env;
      this.closureId = stackFrameTop.closureId;
      this.OS = stackFrameTop.OS;
      this.PC = stackFrameTop.PC;
      this.OS.push(currTop);
    }

    const last = this.OS.pop();
    if (last === undefined) {
      return err('There is no element to return from operand stack');
    }
    return last;
  }
}
