import { NonemptyEnvironment } from '../environment';

type ModuleName = string;

// A module is basically an environment we can evaluate in
export interface Module {
  name: ModuleName;
  env: NonemptyEnvironment;
}
