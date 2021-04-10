import { make_empty_bindings, make_env, make_env_list } from '../../environment';
import { ExprOrDefineForm } from '../../fep-types';
import { primitives_module } from '../../modules';
import { read } from '../../reader';
import { sboolean, snumber, ssymbol } from '../../sexpr';
import { getOk, ok } from '../../utils/result';
import { compile_fep_to_bytecode, make_program_state } from '../compiler';
import { VirtualMachine } from '../virtual_machine';

const init_machine = (programString: string): VirtualMachine => {
  const the_global_environment = make_env_list(primitives_module.provides);
  const test_env = make_env(make_empty_bindings(), the_global_environment);
  const programState = make_program_state();
  const compiledProgram = compile_fep_to_bytecode(
    getOk(read(programString)) as ExprOrDefineForm,
    programState
  );
  return new VirtualMachine(compiledProgram, programState, test_env);
};

test('evaluate quote', () => {
  expect(init_machine(`(quote 1)`).run()).toEqual(ok(snumber(1)));
  expect(init_machine(`(quote #t)`).run()).toEqual(ok(sboolean(true)));
  expect(init_machine(`(quote a)`).run()).toEqual(ok(ssymbol('a')));
});

test('evaluate begin and begin0', () => {
  expect(
    init_machine(`(begin
                    (quote a)
                    (quote b)
                    (quote 1))`).run()
  ).toEqual(ok(snumber(1)));

  expect(
    init_machine(`(begin
                    (quote a)
                    (quote b)
                    (quote c)
                    (quote d))`).run()
  ).toEqual(ok(ssymbol('d')));

  expect(
    init_machine(`(begin0
                    (quote a)
                    (quote b)
                    (quote 1))`).run()
  ).toEqual(ok(ssymbol('a')));

  expect(
    init_machine(`(begin0
                    (quote a)
                    (quote b)
                    (quote c)
                    (quote d))`).run()
  ).toEqual(ok(ssymbol('a')));
});

test('evaluate define and #%variable-reference', () => {
  expect(init_machine(`(define x (quote 10))`).run()).toEqual(ok(snumber(10)));
  expect(
    init_machine(`(begin
                    (define x (quote 1))
                    (#%variable-reference x))`).run()
  ).toEqual(ok(snumber(1)));
  expect(
    init_machine(`(begin
                    (define y (quote #t))
                    (#%variable-reference y))`).run()
  ).toEqual(ok(sboolean(true)));
});

test('evaluate set!', () => {
  expect(
    init_machine(`
    (begin
      (define x (quote 1))
      (set! x (quote 2))
      (#%variable-reference x))
  `).run()
  ).toEqual(ok(snumber(2)));
});

test('evaluate if', () => {
  expect(
    init_machine(`
      (if (quote #t) (quote 1) (quote 2))
    `).run()
  ).toEqual(ok(snumber(1)));

  expect(
    init_machine(`
      (if (quote #f) (quote 1) (quote 2))
    `).run()
  ).toEqual(ok(snumber(2)));

  expect(
    init_machine(`
      (if (quote a) (quote 1) (quote 2))
    `).run()
  ).toEqual(ok(snumber(1)));

  expect(
    init_machine(`
      (if (quote #t)
        (if (quote #f)
          (quote 1)
          (quote 2))
        (quote 3))
    `).run()
  ).toEqual(ok(snumber(2)));
});

test('evaluate let', () => {
  expect(
    init_machine(`
    (let
      ([x (quote 1)])
      (#%variable-reference x))
  `).run()
  ).toEqual(ok(snumber(1)));

  expect(
    init_machine(`
    (begin
      (define x (quote 10))
      (let
        ([x (quote 20)])
        (#%variable-reference x))
      (#%variable-reference x))
  `).run()
  ).toEqual(ok(snumber(10)));

  expect(
    init_machine(`
    (begin
      (define x (quote 10))
      (let
        ([x (quote 20)])
        (#%variable-reference x)))
  `).run()
  ).toEqual(ok(snumber(20)));

  expect(
    init_machine(`
    (begin
      (define x (quote 10))
      (let
        ([x (quote 20)]
         [y (#%variable-reference x)])
        (#%variable-reference y)))
  `).run()
  ).toEqual(ok(snumber(10)));
});
