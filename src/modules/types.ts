import { Bindings } from '../environment';

type ModuleName = string;

// A module is basically a bunch of variables and syntaxes
// that we can add to our environment
export interface Module {
  name: ModuleName;
  provides: Bindings;
}
