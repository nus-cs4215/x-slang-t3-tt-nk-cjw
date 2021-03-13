import { NonemptyEnvironment } from '../environment';

export type ModuleName = string;

// A module is basically an environment we can evaluate in
export interface Module {
  name: ModuleName;
  env: NonemptyEnvironment;
}
