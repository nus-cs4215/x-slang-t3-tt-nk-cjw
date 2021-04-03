import { CompiledProgramTree } from './compiler';

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
