import {
  // SExpr,
  // satom,
  snumber,
  sboolean,
  snil,
  // scons,
  // slist,
  // sconslist_iterator,
  // equals,
} from '../../sexpr';
import { evaluate } from '../evaluator';
import { ok } from '../../utils';

test('Normal form value equality', () => {
    expect(evaluate(snumber(1))).toEqual(ok(snumber(1)));
    expect(evaluate(sboolean(true))).toEqual(ok(sboolean(true)));
    expect(evaluate(snil())).toEqual(ok(snil()));
})
