import { Result } from '../utils';

import { SListStruct } from '../sexpr';

export type Closure = void;

export type EvalValue = SListStruct<Closure>;

export type EvalResult = Result<EvalValue, void>;
