import { Environment } from '../environment';
import { EvalResult } from '../evaluator/types';
import { ok, err } from '../utils/result';
import { CompiledProgram, ProgramState } from './compiler';
import { MAKE_CONST } from './opcodes';

export class VirtualMachine {
  P: CompiledProgram;
  programState: ProgramState;
  os: EvalResult[];
  env: Environment;
  closureId: number;
  PC: number;
  registers: EvalResult[];
  M: Microcode[];

  constructor(
    P: CompiledProgram,
    programState: ProgramState,
    env: Environment,
    os: EvalResult[] = [],
    closureId: number = -1, // denotes top level closure
    PC: number = 0
  ) {
    this.P = P;
    this.programState = programState;
    this.os = os;
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
      this.os.push(ok(sexpr));
      this.PC += 2;
    };
    return M;
  }

  run(): EvalResult {
    while (this.P[this.PC] !== undefined) {
      this.M[this.P[this.PC]]();
    }

    const last = this.os.pop();
    if (last === undefined) {
      return err('There is no element to return from operand stack');
    }
    return last;
  }
}

export type Microcode = () => void;
