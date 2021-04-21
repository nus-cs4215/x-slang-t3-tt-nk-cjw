// OpCodes
export const MAKE_CONST = 0; // followed by a <const id>
export const POP_N = 1; // followed by n, number of things to pop
export const ADD_BINDING = 2; // followed by a <name id>
export const GET_ENV = 3; // followed by a <name id>
export const SET_ENV = 4; // followed by a <name id>
export const MAKE_FUNC = 5; // followed by a <closure id>
export const JUMP_IF_FALSE = 6; // followed by absolute position
export const JUMP = 7; // followed by absolute position
export const ADD_BINDING_SYNTAX = 8; // followed by a <name id>
export const EXTEND_ENV = 9;
export const ADD_BINDING_UNDEFINED = 10; // followed by a <name id>
export const CALL = 11; // followed by a <closure id>
export const END_SCOPE = 12;

export const get_opcode_names = (): string[] => {
  const names = [];
  names[MAKE_CONST] = 'MAKE_CONST';
  names[POP_N] = 'POP_N';
  names[ADD_BINDING] = 'ADD_BINDING';
  names[GET_ENV] = 'GET_ENV';
  names[SET_ENV] = 'SET_ENV';
  names[MAKE_FUNC] = 'MAKE_FUNC';
  names[JUMP_IF_FALSE] = 'JUMP_IF_FALSE';
  names[JUMP] = 'JUMP';
  names[ADD_BINDING_SYNTAX] = 'ADD_BINDING_SYNTAX';
  names[EXTEND_ENV] = 'EXTEND_ENV';
  names[ADD_BINDING_UNDEFINED] = 'ADD_BINDING_UNDEFINED';
  names[CALL] = 'CALL';
  names[END_SCOPE] = 'END_SCOPE';
  return names;
};

export const get_opcode_paramCounts = (): number[] => {
  const paramCounts = [];
  paramCounts[MAKE_CONST] = 1;
  paramCounts[POP_N] = 1;
  paramCounts[ADD_BINDING] = 1;
  paramCounts[GET_ENV] = 1;
  paramCounts[SET_ENV] = 1;
  paramCounts[MAKE_FUNC] = 1;
  paramCounts[JUMP_IF_FALSE] = 1;
  paramCounts[JUMP] = 1;
  paramCounts[ADD_BINDING_SYNTAX] = 1;
  paramCounts[EXTEND_ENV] = 0;
  paramCounts[ADD_BINDING_UNDEFINED] = 1;
  paramCounts[CALL] = 1;
  paramCounts[END_SCOPE] = 0;
  return paramCounts;
};
