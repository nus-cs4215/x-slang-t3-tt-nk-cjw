import { maps_to_compiler_host } from '../../host';
import { print } from '../../printer';
import { getErr, getOk } from '../../utils';
import { compile_file, compile_entrypoint } from '../compiler';
import { ts_based_modules } from '../compiler-base';

function readCompilePrint(module_contents: string) {
  const host = maps_to_compiler_host(new Map([['/input.rkt', module_contents]]), ts_based_modules);
  const compile_result = compile_entrypoint('/input.rkt', host);
  const fep_contents = print(getOk(compile_result));
  return fep_contents;
}
function expectReadCompilePrint(module_contents: string) {
  // const host = maps_to_compiler_host(new Map([['/input.rkt', module_contents]]), ts_based_modules);
  // const compile_result = compile_v2_entrypoint('/input.rkt', host);
  // const fep_contents = print(getOk(compile_result));
  // const compile_result = compile(host, '/input.rkt');
  // const compiled_input = getOk(compile_result).compiled_filenames.get('/input.rkt')!;
  // const fep_contents = getOk(host.read_file(compiled_input));
  return expect(readCompilePrint(module_contents));
  // return expect(
  //   print(getOk(compile_module('input.rkt', module_contents, builtin_compiler_host)).fep)
  // );
}

function expectReadCompileError(module_contents: string) {
  const host = maps_to_compiler_host(new Map([['/input.rkt', module_contents]]), ts_based_modules);
  const compile_result = compile_entrypoint('/input.rkt', host);
  // const compile_result = compile(host, '/input.rkt');
  return expect(getErr(compile_result));
  // return expect(getErr(compile_module('input.rkt', module_contents, builtin_compiler_host)));
}

describe('module forms work as expected', () => {
  test('empty module', () => {
    // no statements
    expectReadCompilePrint(`
      (module name '#%builtin-empty (#%plain-module-begin))
    `).toMatchInlineSnapshot(`"(module name (quote #%builtin-empty) (#%plain-module-begin))"`);
  });

  test('load kernel module', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel (#%plain-module-begin))
    `).toMatchInlineSnapshot(`"(module name (quote #%builtin-kernel) (#%plain-module-begin))"`);
  });

  test('make datum', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel 1)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (quote 1)))"`
    );
  });

  test('compile file based parent modules', () => {
    const host = maps_to_compiler_host(
      new Map([
        ['/input.rkt', '(module input parent (#%plain-module-begin))'],
        ['/parent.rkt', "(module parent '#%builtin-empty (#%plain-module-begin))"],
      ]),
      ts_based_modules
    );
    const compiled_filenames = new Map();
    const compile_result = compile_file('/input.rkt', {
      host,
      compiled_filenames,
      expansion_depth: 0,
      MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
    });
    expect(print(getOk(compile_result))).toMatchInlineSnapshot(
      `"(module input parent (#%plain-module-begin))"`
    );
    expect(compiled_filenames).toMatchInlineSnapshot(`
      Map {
        "/parent.rkt" => "/parent.rkt.fep",
        "/input.rkt" => "/input.rkt.fep",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/input.rkt'))).toMatchInlineSnapshot(`
        Object {
          "err": undefined,
          "good": true,
          "v": "(module input parent (#%plain-module-begin))",
        }
      `);
    expect(host.read_file(compiled_filenames.get('/parent.rkt'))).toMatchInlineSnapshot(`
        Object {
          "err": undefined,
          "good": true,
          "v": "(module parent (quote #%builtin-empty) (#%plain-module-begin))",
        }
      `);
  });

  test('compile file based parent modules and import their contents', () => {
    const host = maps_to_compiler_host(
      new Map([
        ['/input.rkt', '(module input parent (1 2))'],
        [
          '/parent.rkt',
          "(module parent '#%builtin-kernel (#%provide #%module-begin #%app #%datum #%plain-app quote))",
        ],
      ]),
      ts_based_modules
    );
    const compiled_filenames = new Map();
    const compile_result = compile_file('/input.rkt', {
      host,
      compiled_filenames,
      expansion_depth: 0,
      MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
    });
    expect(print(getOk(compile_result))).toMatchInlineSnapshot(
      `"(module input parent (#%plain-module-begin (#%plain-app (quote 1) (quote 2))))"`
    );
    expect(compiled_filenames).toMatchInlineSnapshot(`
      Map {
        "/parent.rkt" => "/parent.rkt.fep",
        "/input.rkt" => "/input.rkt.fep",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/input.rkt'))).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": "(module input parent (#%plain-module-begin (#%plain-app (quote 1) (quote 2))))",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/parent.rkt'))).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": "(module parent (quote #%builtin-kernel) (#%plain-module-begin (#%provide #%module-begin #%app #%datum #%plain-app quote)))",
      }
    `);
  });

  test('require syntax transformer', () => {
    const host = maps_to_compiler_host(
      new Map([
        ['/input.rkt', "(module input '#%builtin-kernel (#%require parent) x)"],
        [
          '/parent.rkt',
          "(module parent '#%builtin-kernel (define-syntax x (#%plain-lambda (stx) 5)) (#%provide x))",
        ],
      ]),
      ts_based_modules
    );
    const compiled_filenames = new Map();
    const compile_result = compile_file('/input.rkt', {
      host,
      compiled_filenames,
      expansion_depth: 0,
      MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
    });
    expect(print(getOk(compile_result))).toMatchInlineSnapshot(
      `"(module input (quote #%builtin-kernel) (#%plain-module-begin (#%require parent) (quote 5)))"`
    );
    expect(compiled_filenames).toMatchInlineSnapshot(`
      Map {
        "/parent.rkt" => "/parent.rkt.fep",
        "/input.rkt" => "/input.rkt.fep",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/input.rkt'))).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": "(module input (quote #%builtin-kernel) (#%plain-module-begin (#%require parent) (quote 5)))",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/parent.rkt'))).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": "(module parent (quote #%builtin-kernel) (#%plain-module-begin (define-syntax x (#%plain-lambda (stx) (quote 5))) (#%provide x)))",
      }
    `);
  });

  test('require and rename syntax transformer', () => {
    const host = maps_to_compiler_host(
      new Map([
        ['/input.rkt', "(module input '#%builtin-kernel (#%require (rename parent x y)) y)"],
        [
          '/parent.rkt',
          "(module parent '#%builtin-kernel (define-syntax x (#%plain-lambda (stx) 5)) (#%provide x))",
        ],
      ]),
      ts_based_modules
    );
    const compiled_filenames = new Map();
    const compile_result = compile_file('/input.rkt', {
      host,
      compiled_filenames,
      expansion_depth: 0,
      MAX_MACRO_EXPANSION_DEPTH_LIMIT: 100000,
    });
    expect(print(getOk(compile_result))).toMatchInlineSnapshot(
      `"(module input (quote #%builtin-kernel) (#%plain-module-begin (#%require (rename parent x y)) (quote 5)))"`
    );
    expect(compiled_filenames).toMatchInlineSnapshot(`
      Map {
        "/parent.rkt" => "/parent.rkt.fep",
        "/input.rkt" => "/input.rkt.fep",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/input.rkt'))).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": "(module input (quote #%builtin-kernel) (#%plain-module-begin (#%require (rename parent x y)) (quote 5)))",
      }
    `);
    expect(host.read_file(compiled_filenames.get('/parent.rkt'))).toMatchInlineSnapshot(`
      Object {
        "err": undefined,
        "good": true,
        "v": "(module parent (quote #%builtin-kernel) (#%plain-module-begin (define-syntax x (#%plain-lambda (stx) (quote 5))) (#%provide x)))",
      }
    `);
  });

  test.skip('only provided definitions can be used', () => {
    const host = maps_to_compiler_host(
      new Map([
        ['/input.rkt', '(module input parent (* 1 2))'],
        [
          '/parent.rkt',
          "(module parent '#%builtin-kernel (#%plain-module-begin (#%provide #%module-begin #%app #%plain-app #%datum quote #%top #%variable-reference +)))",
        ],
      ]),
      ts_based_modules
    );
    const compile_result = compile_entrypoint('/input.rkt', host);
    expect(compile_result).toMatchInlineSnapshot();
  });
});

describe('general compilation tests', () => {
  test('compilation is idempotent', () => {
    const compiled = readCompilePrint(`
      (module name '#%builtin-base-lang (define f (lambda (x) x)))
    `);
    expectReadCompilePrint(compiled).toEqual(compiled);
  });
});

describe('function application expressions and datum', () => {
  test('load kernel module and use core syntactic forms', () => {
    // core syntactic forms
    expectReadCompilePrint(`
      (module name '#%builtin-kernel (quote 1) (#%plain-app (quote 2)))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (quote 1) (#%plain-app (quote 2))))"`
    );
  });

  test('load primitives module and access identifier', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives (#%plain-module-begin pi))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-primitives) (#%plain-module-begin (#%variable-reference pi)))"`
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
});

describe('lambda', () => {
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
});

describe('define and define-syntax in module form', () => {
  test('load primitives module and define something', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives (#%plain-module-begin (define something pi)))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-primitives) (#%plain-module-begin (define something (#%variable-reference pi))))"`
    );
  });

  test('load primitives module and define something and use it', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-primitives (#%plain-module-begin (define something pi) something))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-primitives) (#%plain-module-begin (define something (#%variable-reference pi)) (#%variable-reference something)))"`
    );
  });

  test('make syntax transformer', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-base-lang
        (define-syntax foo (lambda (stx) 1))
        foo
      )
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-base-lang) (#%plain-module-begin (define-syntax foo (#%plain-lambda (stx) (quote 1))) (quote 1)))"`
    );
  });
});

test('begin and begin0', () => {
  expectReadCompilePrint(`
      (module name '#%builtin-kernel
        ; module level begin
        (begin
          (define x 1)
          (define y 2))

        ; expression level begin
        (define z
          (begin 1 2 3))

        ; expression level begin0
        (define z0
          (begin0 1 2 3))
      )
    `).toMatchInlineSnapshot(
    `"(module name (quote #%builtin-kernel) (#%plain-module-begin (define x (quote 1)) (define y (quote 2)) (define z (begin (quote 1) (quote 2) (quote 3))) (define z0 (begin0 (quote 1) (quote 2) (quote 3)))))"`
  );
});

test('if', () => {
  expectReadCompilePrint(`
      (module name '#%builtin-kernel
        ; module level if
        (if #t 1 2)

        ; expression level if
        (define z
          (if #t 1 2))
      )
    `).toMatchInlineSnapshot(
    `"(module name (quote #%builtin-kernel) (#%plain-module-begin (if (quote #t) (quote 1) (quote 2)) (define z (if (quote #t) (quote 1) (quote 2)))))"`
  );
});

test('let and letrec', () => {
  expectReadCompilePrint(`
      (module name '#%builtin-kernel
        ; module level begin
        (define x
          (let [
            (y 1)
            (z 2)
          ]
            (+ y z))
        )

        (let [
          (y 1)
          (z 2)
        ]
          (+ y z))
      )
    `).toMatchInlineSnapshot(
    `"(module name (quote #%builtin-kernel) (#%plain-module-begin (define x (let ((y (quote 1)) (z (quote 2))) (#%plain-app (#%variable-reference +) (#%variable-reference y) (#%variable-reference z)))) (let ((y (quote 1)) (z (quote 2))) (#%plain-app (#%variable-reference +) (#%variable-reference y) (#%variable-reference z)))))"`
  );
});


test('stdlib', () => {
  // (let* ([id val-expr] ...) body ...+)
  expectReadCompilePrint(`
      (module name '#%builtin-kernel

        (define-syntax let*
          (#%plain-lambda (let*+stx)
            (define stx (cdr let*+stx))
            (define bindings (car stx))
            (define body (cdr stx))
            (if (null? bindings)
              (cons 'begin body) ; use begin because body is multiple statements
              (cons 'let
                (cons (cons (car bindings) '())
                  (cons (let* (cdr bindings) body))
                    '()))))))

        (let* ([a 1] [b a]) b)
        ; TRANSFORM
        ; ('let ([a 1]) (let* ([b a]) b))
        ; (let ([a 1]) (let ([b a]) (let* () b)))
        ; (let ([a 1]) (let ([b a]) (let () b)))
      )
`).toMatchInlineSnapshot('"' + readCompilePrint(`
      (module name '#%builtin-kernel

        (define-syntax let*
          (#%plain-lambda (let*+stx)
            (define stx (cdr let*+stx))
            (define bindings (car stx))
            (define body (cdr stx))
            (if (null? bindings)
              (cons 'begin body) ; use begin because body is multiple statements
              (cons 'let
                (cons (cons (car bindings) '())
                  (cons (let* (cdr bindings) body))
                    '()))))))

        (let ([a 1]) (let ([b a]) (let () b))))
`) + '"');
});

describe('compile fails', () => {
  test('nonexistent parent module', () => {
    expectReadCompileError(`
      (module name '#%builtin-nonexistent)
    `).toMatchInlineSnapshot(`"builtin module not found: #%builtin-nonexistent"`);
  });

  test.skip('use nonexistent binding', () => {
    expectReadCompileError(`
      (module name '#%builtin-kernel x)
    `).toMatchInlineSnapshot();
  });

  test("can't trick core syntactic forms", () => {
    expectReadCompileError(`
      (module name '#%builtin-kernel (#%plain-app . 1))
    `).toMatchInlineSnapshot(`"did not match pattern for #%plain-app: (#%plain-app . 1)"`);

    expectReadCompileError(`
      (module name '#%builtin-kernel (quote))
    `).toMatchInlineSnapshot(`"did not match pattern for quote: (quote)"`);
    expectReadCompileError(`
      (module name '#%builtin-kernel (quote . 1))
    `).toMatchInlineSnapshot(`"did not match pattern for quote: (quote . 1)"`);
    expectReadCompileError(`
      (module name '#%builtin-kernel (quote 1 2))
    `).toMatchInlineSnapshot(`"did not match pattern for quote: (quote 1 2)"`);

    expectReadCompileError(`
      (module name '#%builtin-kernel (define))
    `).toMatchInlineSnapshot(`"did not match form for define: (define)"`);
    expectReadCompileError(`
      (module name '#%builtin-kernel (define x))
    `).toMatchInlineSnapshot(`"did not match form for define: (define x)"`);
    expectReadCompileError(`
      (module name '#%builtin-kernel (define (x) 2))
    `).toMatchInlineSnapshot(`"did not match form for define: (define (x) 2)"`);
    expectReadCompileError(`
      (module name '#%builtin-kernel (define 1 2))
    `).toMatchInlineSnapshot(`"did not match form for define: (define 1 2)"`);
  });

  test.skip('nonexistent binding in expr', () => {
    expectReadCompileError(`
      (module name '#%builtin-kernel (define x y))
    `).toMatchInlineSnapshot(`"#%module-begin not bound in (#%module-begin (define x y))"`);
  });

  test('making datum without #%datum in environment', () => {
    expectReadCompileError(`
      (module name '#%builtin-empty (#%plain-module-begin 1))
    `).toMatchInlineSnapshot(`"#%datum not bound in (#%datum . 1)"`);
  });

  test('making app without #%app in environment', () => {
    expectReadCompileError(`
      (module name '#%builtin-empty (#%plain-module-begin ()))
    `).toMatchInlineSnapshot(`"#%app not bound in (#%app)"`);
  });

  test.skip('using lambda without base lang', () => {
    expectReadCompileError(`
      (module name '#%builtin-kernel (lambda (x) x))
    `).toMatchInlineSnapshot();
  });

  test('demo', () => {
    expectReadCompilePrint(`
      (module name '#%builtin-kernel)
    `).toMatchInlineSnapshot(`"(module name (quote #%builtin-kernel) (#%plain-module-begin))"`);
    expectReadCompilePrint(`
      (module name '#%builtin-kernel f)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (#%variable-reference f)))"`
    );
    expectReadCompilePrint(`
      (module name '#%builtin-kernel (f 1))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (#%plain-app (#%variable-reference f) (quote 1))))"`
    );
    expectReadCompilePrint(`
      (module name '#%builtin-kernel
        (define-syntax f
          (#%plain-lambda (stx) 1))
        f)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (define-syntax f (#%plain-lambda (stx) (quote 1))) (quote 1)))"`
    );
    expectReadCompilePrint(`
      (module name '#%builtin-kernel
        (define-syntax f (#%plain-lambda (stx) 1))
        (define-syntax g (#%plain-lambda (stx) 'f))
        g)
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (define-syntax f (#%plain-lambda (stx) (quote 1))) (define-syntax g (#%plain-lambda (stx) (quote f))) (quote 1)))"`
    );
    expectReadCompilePrint(`
      (module name '#%builtin-kernel
        (define-syntax f
          (#%plain-lambda (stx)
            (cons (car (cdr stx))
              (cons (cdr (cdr stx))
                '()))))
        (f 1 2))
    `).toMatchInlineSnapshot(
      `"(module name (quote #%builtin-kernel) (#%plain-module-begin (define-syntax f (#%plain-lambda (stx) (#%plain-app (#%variable-reference cons) (#%plain-app (#%variable-reference car) (#%plain-app (#%variable-reference cdr) (#%variable-reference stx))) (#%plain-app (#%variable-reference cons) (#%plain-app (#%variable-reference cdr) (#%plain-app (#%variable-reference cdr) (#%variable-reference stx))) (quote ()))))) (#%plain-app (quote 1) (#%plain-app (quote 2)))))"`
    );
  });
});
