import { Environment, set_define } from '../environment';
import {
  BindingType,
  define_binding,
  find_env,
  get_binding,
  make_empty_bindings,
  make_env,
  set_binding,
} from '../environment/environment';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { is_boolean, val } from '../sexpr';
import { sbox } from '../sexpr/sexpr';
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

export class VirtualMachine {
  P: CompiledProgram;
  programState: ProgramState;
  OS: EvalResult[];
  env: Environment;
  closureId: number;
  PC: number;
  registers: EvalResult[];

  constructor(
    P: CompiledProgram,
    programState: ProgramState,
    env: Environment,
    OS: EvalResult[] = [],
    closureId: number = -1, // denotes top level closure
    PC: number = 0
  ) {
    this.P = P;
    this.programState = programState;
    this.OS = OS;
    this.env = env;
    this.closureId = closureId;
    this.PC = PC;
  }

  getName(nameId: number): string {
    return this.programState.nameIdToName[nameId];
  }

  run(): EvalResult {
    while (this.PC < this.P.length) {
      M[this.P[this.PC]](this);
    }

    const last = this.OS.pop();
    if (last === undefined) {
      return err('There is no element to return from operand stack');
    }
    return last;
  }
}
