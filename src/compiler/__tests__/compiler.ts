import { print } from '../../printer';
import { getErr, getOk } from '../../utils';
import { compile_module } from '../compiler';

function expectReadCompilePrint(module_contents: string) {
  return expect(print(getOk(compile_module(module_contents))));
}

function expectReadCompileError(module_contents: string) {
  return expect(getErr(compile_module(module_contents)));
}

describe('compile succeeds', () => {
  test('empty module', () => {
    // no statements
    expectReadCompilePrint(`
      (module name '#%builtin-empty)
    `).toMatchInlineSnapshot(`"(module name (quote #%builtin-empty) (#%plain-module-begin))"`);

    // core syntactic forms
    expectReadCompilePrint(`
      (module name '#%builtin-empty (quote 1) (#%plain-app (quote 1)))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-empty) (#%plain-module-begin (quote 1) (#%plain-app (quote 1))))"`
    );
  });

  test('load primitives module', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives)
    `).toMatchInlineSnapshot(`"(module name (quote #%builtin-primitives) (#%plain-module-begin))"`);
  });

  test('load primitives module and access identifier', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives pi)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-primitives) (#%plain-module-begin (#%variable-reference pi)))"`
    );
  });

  test('load primitives module and define something', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives (define something pi))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-primitives) (#%plain-module-begin (define something (#%variable-reference pi))))"`
    );
  });

  test('load primitives module and define something and use it', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives (define something pi) something)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-primitives) (#%plain-module-begin (define something (#%variable-reference pi)) (#%variable-reference something)))"`
    );
  });

  test('load kernel module', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel)
    `).toMatchInlineSnapshot(`"(module name (quote #%builtin-kernel) (#%plain-module-begin))"`);
  });

  test('make datum', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel 1)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (quote 1)))"`
    );
  });

  test('make datum in expression', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel (define x 1))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (define x (quote 1))))"`
    );
  });

  test('make app', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel (1 1))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (#%plain-app (quote 1) (quote 1))))"`
    );
  });

  test('make lambda', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-base-lang (lambda (x) x))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-base-lang) (#%plain-module-begin (#%plain-lambda (x) (#%variable-reference x))))"`
    );
  });

  test('make lambda in expression context', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-base-lang (define f (lambda (x) x)))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-base-lang) (#%plain-module-begin (define f (#%plain-lambda (x) (#%variable-reference x)))))"`
    );
  });

  test('compilation is idempotent', () => {
    const compiled = print(
      getOk(compile_module("(module name '#%builtin-base-lang (define f (lambda (x) x)))"))
    );
    expectReadCompilePrint(compiled).toEqual(compiled);
  });
});

describe('compile fails', () => {
  test('nonexistent parent module', () => {
    expectReadCompileError(`
      (module name '#%builtin-nonexistent)
    `).toMatchInlineSnapshot(`"could not load parent module"`);
  });

  test('use nonexistent binding', () => {
    expectReadCompileError(`
      (module name '#%builtin-empty x)
    `).toMatchInlineSnapshot(`"unbound variable x"`);
  });

  test("can't trick core syntactic forms", () => {
    expectReadCompileError(`
      (module name '#%builtin-empty (#%plain-app not an FEP))
    `).toMatchInlineSnapshot(`"error expanding body of #%plain-app"`);
    expectReadCompileError(`
      (module name '#%builtin-empty (#%plain-app . 1))
    `).toMatchInlineSnapshot(`"#%plain-app should be proper list"`);
    expectReadCompileError(`
      (module name '#%builtin-empty (quote))
    `).toMatchInlineSnapshot(`"quote should be a proper list containing exactly 1 argument"`);
    expectReadCompileError(`
      (module name '#%builtin-empty (quote . 1))
    `).toMatchInlineSnapshot(`"quote should be a proper list containing exactly 1 argument"`);
    expectReadCompileError(`
      (module name '#%builtin-empty (quote 1 2))
    `).toMatchInlineSnapshot(`"quote should be a proper list containing exactly 1 argument"`);
  });

  test('nonexistent binding in expr', () => {
    expectReadCompileError(`
      (module name '#%builtin-empty (define x y))
    `).toMatchInlineSnapshot(`"unbound variable y"`);
  });

  test('making datum without #%datum in environment', () => {
    expectReadCompileError(`
      (module name '#%builtin-empty 1)
    `).toMatchInlineSnapshot(`"unbound variable #%datum"`);
  });

  test('making app without #%app in environment', () => {
    expectReadCompileError(`
      (module name '#%builtin-empty ())
    `).toMatchInlineSnapshot(`"unbound variable #%app"`);
  });

  test('use before define', () => {
    expectReadCompileError(`
      (module name '#%builtin-primitives something (define something pi))
    `).toMatchInlineSnapshot(`"unbound variable something"`);
  });

  test('using lambda without base lang', () => {
    expectReadCompileError(`
      (module name '#%builtin-primitives (lambda (x) x))
    `).toMatchInlineSnapshot(`"unbound variable lambda"`);
  });
});
