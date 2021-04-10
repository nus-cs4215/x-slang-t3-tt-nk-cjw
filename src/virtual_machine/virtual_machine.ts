import { Environment, set_define } from '../environment';
import { BindingType, find_env, get_binding } from '../environment/environment';
import { EvalResult, EvalSExpr } from '../evaluator/types';
import { ok, err, getOk } from '../utils/result';
import { CompiledProgram, ProgramState } from './compiler';
import { MAKE_CONST, ADD_BINDING, GET_ENV, POP_N } from './opcodes';

export class VirtualMachine {
  P: CompiledProgram;
  programState: ProgramState;
  OS: EvalResult[];
  env: Environment;
  closureId: number;
  PC: number;
  registers: EvalResult[];
  M: Microcode[];

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
    this.M = this.initMicrocode();
  }

  private initMicrocode(): Microcode[] {
    const M: Microcode[] = [];
    M[MAKE_CONST] = () => {
      const id = this.P[this.PC + 1];
      const sexpr = this.programState.constIdToSExpr[id];
      this.OS.push(ok(sexpr));
      this.PC += 2;
    };
    M[POP_N] = () => {
      const n = this.P[this.PC + 1];
      for (let i = 0; i < n; i++) {
        this.OS.pop();
      }

      this.PC += 2;
    };

    M[ADD_BINDING] = () => {
      const sexpr = this.OS[this.OS.length - 1];
      if (sexpr === undefined) {
        console.error(`ADD_BINDING: found an empty operand stack`);
        return;
      }
      const nameId = this.P[this.PC + 1];
      const name = this.getName(nameId);

      set_define(this.env!.bindings, name, getOk(sexpr));

      this.PC += 2;
    };

    M[GET_ENV] = () => {
      const nameId = this.P[this.PC + 1];
      const name = this.getName(nameId);

      const found_env = find_env(name, this.env);
      if (found_env === undefined) {
        console.error(`GET_ENV: could not find variable ${name}`);
        return;
      }

      const binding = get_binding(found_env.bindings, name)!;
      if (binding._type !== BindingType.Define || binding.val === undefined) {
        console.error(`GET_ENV: tried to use variable ${name} before initialization`);
        return;
      }

      this.OS.push(ok(binding.val as EvalSExpr));
      this.PC += 2;
    };

    return M;
  }

  private getName(nameId: number): string {
    return this.programState.nameIdToName[nameId];
  }

  run(): EvalResult {
    while (this.P[this.PC] !== undefined) {
      this.M[this.P[this.PC]]();
    }

    const last = this.OS.pop();
    if (last === undefined) {
      return err('There is no element to return from operand stack');
    }
    return last;
  }
}

type Microcode = () => void;
