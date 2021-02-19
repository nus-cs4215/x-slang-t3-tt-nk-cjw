import { print } from '../printer';
import { read } from '../reader';
import { evaluate, the_global_environment } from '../evaluator';
import { cases, formatTable, getOk } from '../utils';

function expectOpTable(ops: string[], tests: string[]) {
  return expect(
    formatTable(
      [
        ...tests.map((test) => [
          test,
          ...ops.map((op) =>
            cases(
              evaluate(getOk(read(`(let ([op ${op}]) ${test})`)), the_global_environment),
              print,
              (e) => (e === undefined ? 'ERR' : JSON.stringify(e))
            )
          ),
        ]),
      ],
      { headers: ['test', ...ops], sep: ' | ', prefix: '\n' }
    )
  );
}

// Exporting these to suppress unused locals warnings

export const zeroArgTests = [
  // 0 args
  '(op)',
];

export const oneArgTests = [
  // 1 arg
  '(op 0)',
  '(op 1)',
  '(op 2)',
  '(op 0.1)',
  '(op 2.4)',
  '(op 2.5)',
  '(op 2.6)',
  '(op -2.4)',
  '(op -2.5)',
  '(op -2.6)',
  '(op -1)',
  '(op -2)',
  '(op +inf.0)',
  '(op -inf.0)',
  '(op +nan.0)',
];

export const twoNumArgTests = [
  // 2 args
  '(op 0 0)',
  '(op 1 0)',
  '(op 0 1)',
  '(op 1 1)',
  '(op 3 5)',
  '(op 5 3)',

  '(op 0 +inf.0)',
  '(op 1 +inf.0)',
  '(op 2 +inf.0)',
  '(op +inf.0 0)',
  '(op +inf.0 1)',
  '(op +inf.0 2)',
  '(op +inf.0 +inf.0)',

  '(op 0.1 0)',
  '(op 0 0.1)',
  '(op 0.1 0.1)',
  '(op 0.3 0.5)',
  '(op 0.5 0.3)',

  '(op 3 5)',
  '(op -3 5)',
  '(op 3 -5)',
  '(op -3 -5)',
];

export const mixedTypesArgTests = [
  '(op 0)',

  '(op +inf.0)',
  '(op -inf.0)',
  '(op +nan.0)',

  '(op #f)',
  '(op #t)',

  "(op 'a)",

  '(op 0 0)',
  '(op 1 0)',
  '(op 3 5)',

  '(op #f #f)',
  '(op #t #f)',
  '(op #f #t)',
  '(op #t #t)',

  "(op 'a 'a)",
  "(op 'a 'b)",

  '(op #f 0)',
  "(op 'a 0)",
  "(op 0 'a)",
  '(op 1 #t)',

  '(op 1 1 1 1)',
  '(op 1 2 3 4)',

  '(op #f #f #f)',
  '(op #f #f #f #f)',
  '(op #t #t #t)',
  '(op #t #f #t)',

  "(op 'a 'a 'a)",
  "(op 'a 'b 'b)",
  "(op 'a 'b 'c)",

  "(op 1 2 #t 1 'a)",
];

export const manyNumArgTests = [
  // many args
  '(op 1 1 1 1 1)',
  '(op 2 2 2 1 1)',
  '(op 1 1 1 2 2)',
  '(op 1 4 3 5 2)',
  '(op 1 2 3 4 4)',
  '(op 4 4 3 2 1)',
  '(op 11 13 17)',
  '(op 1 2 3 4 5)',
  '(op 5 4 3 2 1)',
];

export const manySymbolArgTests = [
  "(op 'a 'a 'a)",
  "(op 'a 'a 'b)",
  "(op 'a 'b 'a)",
  "(op 'a 'b 'b)",
  "(op 'a 'b 'c)",

  "(op 'a 'a 'a 'a 'a 'a 'a 'a)",
  "(op 'a 'a 'a 'a 'a 'a 'b 'a)",
  "(op 'a 'b 'c 'd 'e 'f 'g 'h)",
];

export const malformedArgTests = [
  // malformed function call
  '(op 1 . 2)',
  '(op . 1)',

  // unbound vars
  '(op a)',
  '(op a a)',

  // error when evaluating arguments
  '(op ())',
];

export const oneListArgTests = [
  "(op '())",
  "(op '(1))",
  "(op '(1 2))",
  "(op '(1 2 3 4 5))",
  "(op '(1 #t))",
];

test('type predicates', () => {
  expectOpTable(
    ['symbol?', 'number?', 'boolean?', 'null?', 'cons?', 'data?', 'nan?', 'infinite?'],
    []
  ).toMatchInlineSnapshot(`""`);
});

test('unary arithmetic ops', () => {
  expectOpTable(
    [
      'zero?',
      'positive?',
      'negative?',
      'round',
      'floor',
      'ceiling',
      'truncate',
      'sgn',
      'abs',
      'add1',
      'sub1',
      'exp',
      'log',
    ],
    []
  ).toMatchInlineSnapshot(`""`);
});

test('2 arg log', () => {
  expectOpTable(['log'], []).toMatchInlineSnapshot(`""`);
});

test('exactly binary numeric ops', () => {
  expectOpTable(['quotient', 'remainder', 'modulo', 'expt', 'log'], [...mixedTypesArgTests])
    .toMatchInlineSnapshot(`
    "
    test             | quotient | remainder | modulo | expt | log
    ----------------------------------------------------------------------------
    (op 0)           | ERR      | ERR       | ERR    | ERR  | -inf.0
    (op +inf.0)      | ERR      | ERR       | ERR    | ERR  | +inf.0
    (op -inf.0)      | ERR      | ERR       | ERR    | ERR  | +nan.0
    (op +nan.0)      | ERR      | ERR       | ERR    | ERR  | +nan.0
    (op #f)          | ERR      | ERR       | ERR    | ERR  | ERR
    (op #t)          | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a)          | ERR      | ERR       | ERR    | ERR  | ERR
    (op 0 0)         | ERR      | ERR       | ERR    | 1    | +nan.0
    (op 1 0)         | ERR      | ERR       | ERR    | 1    | 0
    (op 3 5)         | 0        | 3         | 3      | 243  | 0.6826061944859853
    (op #f #f)       | ERR      | ERR       | ERR    | ERR  | ERR
    (op #t #f)       | ERR      | ERR       | ERR    | ERR  | ERR
    (op #f #t)       | ERR      | ERR       | ERR    | ERR  | ERR
    (op #t #t)       | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a 'a)       | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a 'b)       | ERR      | ERR       | ERR    | ERR  | ERR
    (op #f 0)        | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a 0)        | ERR      | ERR       | ERR    | ERR  | ERR
    (op 0 'a)        | ERR      | ERR       | ERR    | ERR  | ERR
    (op 1 #t)        | ERR      | ERR       | ERR    | ERR  | ERR
    (op 1 1 1 1)     | ERR      | ERR       | ERR    | ERR  | ERR
    (op 1 2 3 4)     | ERR      | ERR       | ERR    | ERR  | ERR
    (op #f #f #f)    | ERR      | ERR       | ERR    | ERR  | ERR
    (op #f #f #f #f) | ERR      | ERR       | ERR    | ERR  | ERR
    (op #t #t #t)    | ERR      | ERR       | ERR    | ERR  | ERR
    (op #t #f #t)    | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a 'a 'a)    | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a 'b 'b)    | ERR      | ERR       | ERR    | ERR  | ERR
    (op 'a 'b 'c)    | ERR      | ERR       | ERR    | ERR  | ERR
    (op 1 2 #t 1 'a) | ERR      | ERR       | ERR    | ERR  | ERR
    "
  `);
});

test('variable arity arithmetic ops', () => {
  expectOpTable(
    ['+', '-', '*', '/', 'max', 'min'],
    [
      ...zeroArgTests,
      ...oneArgTests,
      ...twoNumArgTests,
      ...manyNumArgTests,
      ...mixedTypesArgTests,
      ...malformedArgTests,

      '(op (op 1 2) 3)',
      '(op 1 (op 2 3))',
    ]
  ).toMatchInlineSnapshot(`
    "
    test               | +      | -      | *                    | /                    | max    | min
    ----------------------------------------------------------------------------------------------------
    (op)               | 0      | ERR    | 1                    | ERR                  | -inf.0 | +inf.0
    (op 0)             | 0      | 0      | 0                    | ERR                  | 0      | 0
    (op 1)             | 1      | -1     | 1                    | 1                    | 1      | 1
    (op 2)             | 2      | -2     | 2                    | 0.5                  | 2      | 2
    (op 0.1)           | 0.1    | -0.1   | 0.1                  | 10                   | 0.1    | 0.1
    (op 2.4)           | 2.4    | -2.4   | 2.4                  | 0.4166666666666667   | 2.4    | 2.4
    (op 2.5)           | 2.5    | -2.5   | 2.5                  | 0.4                  | 2.5    | 2.5
    (op 2.6)           | 2.6    | -2.6   | 2.6                  | 0.3846153846153846   | 2.6    | 2.6
    (op -2.4)          | -2.4   | 2.4    | -2.4                 | -0.4166666666666667  | -2.4   | -2.4
    (op -2.5)          | -2.5   | 2.5    | -2.5                 | -0.4                 | -2.5   | -2.5
    (op -2.6)          | -2.6   | 2.6    | -2.6                 | -0.3846153846153846  | -2.6   | -2.6
    (op -1)            | -1     | 1      | -1                   | -1                   | -1     | -1
    (op -2)            | -2     | 2      | -2                   | -0.5                 | -2     | -2
    (op +inf.0)        | +inf.0 | -inf.0 | +inf.0               | 0                    | +inf.0 | +inf.0
    (op -inf.0)        | -inf.0 | +inf.0 | -inf.0               | 0                    | -inf.0 | -inf.0
    (op +nan.0)        | +nan.0 | +nan.0 | +nan.0               | +nan.0               | +nan.0 | +nan.0
    (op 0 0)           | 0      | 0      | 0                    | ERR                  | 0      | 0
    (op 1 0)           | 1      | 1      | 0                    | ERR                  | 1      | 0
    (op 0 1)           | 1      | -1     | 0                    | 0                    | 1      | 0
    (op 1 1)           | 2      | 0      | 1                    | 1                    | 1      | 1
    (op 3 5)           | 8      | -2     | 15                   | 0.6                  | 5      | 3
    (op 5 3)           | 8      | 2      | 15                   | 1.6666666666666667   | 5      | 3
    (op 0 +inf.0)      | +inf.0 | -inf.0 | +nan.0               | 0                    | +inf.0 | 0
    (op 1 +inf.0)      | +inf.0 | -inf.0 | +inf.0               | 0                    | +inf.0 | 1
    (op 2 +inf.0)      | +inf.0 | -inf.0 | +inf.0               | 0                    | +inf.0 | 2
    (op +inf.0 0)      | +inf.0 | +inf.0 | +nan.0               | ERR                  | +inf.0 | 0
    (op +inf.0 1)      | +inf.0 | +inf.0 | +inf.0               | +inf.0               | +inf.0 | 1
    (op +inf.0 2)      | +inf.0 | +inf.0 | +inf.0               | +inf.0               | +inf.0 | 2
    (op +inf.0 +inf.0) | +inf.0 | +nan.0 | +inf.0               | +nan.0               | +inf.0 | +inf.0
    (op 0.1 0)         | 0.1    | 0.1    | 0                    | ERR                  | 0.1    | 0
    (op 0 0.1)         | 0.1    | -0.1   | 0                    | 0                    | 0.1    | 0
    (op 0.1 0.1)       | 0.2    | 0      | 0.010000000000000002 | 1                    | 0.1    | 0.1
    (op 0.3 0.5)       | 0.8    | -0.2   | 0.15                 | 0.6                  | 0.5    | 0.3
    (op 0.5 0.3)       | 0.8    | 0.2    | 0.15                 | 1.6666666666666667   | 0.5    | 0.3
    (op 3 5)           | 8      | -2     | 15                   | 0.6                  | 5      | 3
    (op -3 5)          | 2      | -8     | -15                  | -0.6                 | 5      | -3
    (op 3 -5)          | -2     | 8      | -15                  | -0.6                 | 3      | -5
    (op -3 -5)         | -8     | 2      | 15                   | 0.6                  | -3     | -5
    (op 1 1 1 1 1)     | 5      | -3     | 1                    | 1                    | 1      | 1
    (op 2 2 2 1 1)     | 8      | -4     | 8                    | 0.5                  | 2      | 1
    (op 1 1 1 2 2)     | 7      | -5     | 4                    | 0.25                 | 2      | 1
    (op 1 4 3 5 2)     | 15     | -13    | 120                  | 0.008333333333333333 | 5      | 1
    (op 1 2 3 4 4)     | 14     | -12    | 96                   | 0.010416666666666666 | 4      | 1
    (op 4 4 3 2 1)     | 14     | -6     | 96                   | 0.16666666666666666  | 4      | 1
    (op 11 13 17)      | 41     | -19    | 2431                 | 0.049773755656108594 | 17     | 11
    (op 1 2 3 4 5)     | 15     | -13    | 120                  | 0.008333333333333333 | 5      | 1
    (op 5 4 3 2 1)     | 15     | -5     | 120                  | 0.20833333333333334  | 5      | 1
    (op 0)             | 0      | 0      | 0                    | ERR                  | 0      | 0
    (op +inf.0)        | +inf.0 | -inf.0 | +inf.0               | 0                    | +inf.0 | +inf.0
    (op -inf.0)        | -inf.0 | +inf.0 | -inf.0               | 0                    | -inf.0 | -inf.0
    (op +nan.0)        | +nan.0 | +nan.0 | +nan.0               | +nan.0               | +nan.0 | +nan.0
    (op #f)            | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #t)            | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a)            | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 0 0)           | 0      | 0      | 0                    | ERR                  | 0      | 0
    (op 1 0)           | 1      | 1      | 0                    | ERR                  | 1      | 0
    (op 3 5)           | 8      | -2     | 15                   | 0.6                  | 5      | 3
    (op #f #f)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #t #f)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #f #t)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #t #t)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a 'a)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a 'b)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #f 0)          | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a 0)          | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 0 'a)          | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 1 #t)          | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 1 1 1 1)       | 4      | -2     | 1                    | 1                    | 1      | 1
    (op 1 2 3 4)       | 10     | -8     | 24                   | 0.041666666666666664 | 4      | 1
    (op #f #f #f)      | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #f #f #f #f)   | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #t #t #t)      | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op #t #f #t)      | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a 'a 'a)      | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a 'b 'b)      | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 'a 'b 'c)      | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 1 2 #t 1 'a)   | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op 1 . 2)         | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op . 1)           | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op a)             | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op a a)           | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op ())            | ERR    | ERR    | ERR                  | ERR                  | ERR    | ERR
    (op (op 1 2) 3)    | 6      | -4     | 6                    | 0.16666666666666666  | 3      | 1
    (op 1 (op 2 3))    | 6      | 2      | 6                    | 1.5                  | 3      | 1
    "
  `);
});

test('numeric comparsion ops', () => {
  expectOpTable(
    ['=', '<', '>', '<=', '>='],
    [...zeroArgTests, '(op 0)', ...twoNumArgTests, ...manyNumArgTests, ...mixedTypesArgTests]
  ).toMatchInlineSnapshot(`
    "
    test               | =   | <   | >   | <=  | >=
    ------------------------------------------------
    (op)               | ERR | ERR | ERR | ERR | ERR
    (op 0)             | #t  | #t  | #t  | #t  | #t
    (op 0 0)           | #t  | #f  | #f  | #t  | #t
    (op 1 0)           | #f  | #f  | #t  | #f  | #t
    (op 0 1)           | #f  | #t  | #f  | #t  | #f
    (op 1 1)           | #t  | #f  | #f  | #t  | #t
    (op 3 5)           | #f  | #t  | #f  | #t  | #f
    (op 5 3)           | #f  | #f  | #t  | #f  | #t
    (op 0 +inf.0)      | #f  | #t  | #f  | #t  | #f
    (op 1 +inf.0)      | #f  | #t  | #f  | #t  | #f
    (op 2 +inf.0)      | #f  | #t  | #f  | #t  | #f
    (op +inf.0 0)      | #f  | #f  | #t  | #f  | #t
    (op +inf.0 1)      | #f  | #f  | #t  | #f  | #t
    (op +inf.0 2)      | #f  | #f  | #t  | #f  | #t
    (op +inf.0 +inf.0) | #t  | #f  | #f  | #t  | #t
    (op 0.1 0)         | #f  | #f  | #t  | #f  | #t
    (op 0 0.1)         | #f  | #t  | #f  | #t  | #f
    (op 0.1 0.1)       | #t  | #f  | #f  | #t  | #t
    (op 0.3 0.5)       | #f  | #t  | #f  | #t  | #f
    (op 0.5 0.3)       | #f  | #f  | #t  | #f  | #t
    (op 3 5)           | #f  | #t  | #f  | #t  | #f
    (op -3 5)          | #f  | #t  | #f  | #t  | #f
    (op 3 -5)          | #f  | #f  | #t  | #f  | #t
    (op -3 -5)         | #f  | #f  | #t  | #f  | #t
    (op 1 1 1 1 1)     | #t  | #f  | #f  | #t  | #t
    (op 2 2 2 1 1)     | #f  | #f  | #f  | #f  | #t
    (op 1 1 1 2 2)     | #f  | #f  | #f  | #t  | #f
    (op 1 4 3 5 2)     | #f  | #f  | #f  | #f  | #f
    (op 1 2 3 4 4)     | #f  | #f  | #f  | #t  | #f
    (op 4 4 3 2 1)     | #f  | #f  | #f  | #f  | #t
    (op 11 13 17)      | #f  | #t  | #f  | #t  | #f
    (op 1 2 3 4 5)     | #f  | #t  | #f  | #t  | #f
    (op 5 4 3 2 1)     | #f  | #f  | #t  | #f  | #t
    (op 0)             | #t  | #t  | #t  | #t  | #t
    (op +inf.0)        | #t  | #t  | #t  | #t  | #t
    (op -inf.0)        | #t  | #t  | #t  | #t  | #t
    (op +nan.0)        | #t  | #t  | #t  | #t  | #t
    (op #f)            | ERR | ERR | ERR | ERR | ERR
    (op #t)            | ERR | ERR | ERR | ERR | ERR
    (op 'a)            | ERR | ERR | ERR | ERR | ERR
    (op 0 0)           | #t  | #f  | #f  | #t  | #t
    (op 1 0)           | #f  | #f  | #t  | #f  | #t
    (op 3 5)           | #f  | #t  | #f  | #t  | #f
    (op #f #f)         | ERR | ERR | ERR | ERR | ERR
    (op #t #f)         | ERR | ERR | ERR | ERR | ERR
    (op #f #t)         | ERR | ERR | ERR | ERR | ERR
    (op #t #t)         | ERR | ERR | ERR | ERR | ERR
    (op 'a 'a)         | ERR | ERR | ERR | ERR | ERR
    (op 'a 'b)         | ERR | ERR | ERR | ERR | ERR
    (op #f 0)          | ERR | ERR | ERR | ERR | ERR
    (op 'a 0)          | ERR | ERR | ERR | ERR | ERR
    (op 0 'a)          | ERR | ERR | ERR | ERR | ERR
    (op 1 #t)          | ERR | ERR | ERR | ERR | ERR
    (op 1 1 1 1)       | #t  | #f  | #f  | #t  | #t
    (op 1 2 3 4)       | #f  | #t  | #f  | #t  | #f
    (op #f #f #f)      | ERR | ERR | ERR | ERR | ERR
    (op #f #f #f #f)   | ERR | ERR | ERR | ERR | ERR
    (op #t #t #t)      | ERR | ERR | ERR | ERR | ERR
    (op #t #f #t)      | ERR | ERR | ERR | ERR | ERR
    (op 'a 'a 'a)      | ERR | ERR | ERR | ERR | ERR
    (op 'a 'b 'b)      | ERR | ERR | ERR | ERR | ERR
    (op 'a 'b 'c)      | ERR | ERR | ERR | ERR | ERR
    (op 1 2 #t 1 'a)   | ERR | ERR | ERR | ERR | ERR
    "
  `);
});

test('trigonometric ops', () => {
  expectOpTable(
    ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh'],
    [...mixedTypesArgTests]
  ).toMatchInlineSnapshot(`
    "
    test             | sin    | cos    | tan    | asin   | acos               | atan                | sinh   | cosh   | tanh
    --------------------------------------------------------------------------------------------------------------------------
    (op 0)           | 0      | 1      | 0      | 0      | 1.5707963267948966 | 0                   | 0      | 1      | 0
    (op +inf.0)      | +nan.0 | +nan.0 | +nan.0 | +nan.0 | +nan.0             | 1.5707963267948966  | +inf.0 | +inf.0 | 1
    (op -inf.0)      | +nan.0 | +nan.0 | +nan.0 | +nan.0 | +nan.0             | -1.5707963267948966 | -inf.0 | +inf.0 | -1
    (op +nan.0)      | +nan.0 | +nan.0 | +nan.0 | +nan.0 | +nan.0             | +nan.0              | +nan.0 | +nan.0 | +nan.0
    (op #f)          | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #t)          | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a)          | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 0 0)         | ERR    | ERR    | ERR    | ERR    | ERR                | 0                   | ERR    | ERR    | ERR
    (op 1 0)         | ERR    | ERR    | ERR    | ERR    | ERR                | 1.5707963267948966  | ERR    | ERR    | ERR
    (op 3 5)         | ERR    | ERR    | ERR    | ERR    | ERR                | 0.5404195002705842  | ERR    | ERR    | ERR
    (op #f #f)       | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #t #f)       | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #f #t)       | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #t #t)       | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a 'a)       | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a 'b)       | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #f 0)        | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a 0)        | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 0 'a)        | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 1 #t)        | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 1 1 1 1)     | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 1 2 3 4)     | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #f #f #f)    | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #f #f #f #f) | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #t #t #t)    | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op #t #f #t)    | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a 'a 'a)    | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a 'b 'b)    | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 'a 'b 'c)    | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    (op 1 2 #t 1 'a) | ERR    | ERR    | ERR    | ERR    | ERR                | ERR                 | ERR    | ERR    | ERR
    "
  `);
});

test('2 arg atan', () => {
  expectOpTable(['atan'], []).toMatchInlineSnapshot(`""`);
});

test('boolean ops', () => {
  expectOpTable(
    ['and', 'or', 'nand', 'nor', 'xor', 'implies', 'not', 'false?'],
    [...mixedTypesArgTests]
  ).toMatchInlineSnapshot(`
    "
    test             | and | or  | nand | nor | xor | implies | not | false?
    ------------------------------------------------------------------------
    (op 0)           | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op +inf.0)      | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op -inf.0)      | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op +nan.0)      | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op #f)          | #f  | #f  | #t   | #t  | #f  | ERR     | #t  | #t
    (op #t)          | #t  | #t  | #f   | #f  | #t  | ERR     | #f  | #f
    (op 'a)          | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 0 0)         | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 1 0)         | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 3 5)         | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op #f #f)       | #f  | #f  | #t   | #t  | #f  | #t      | ERR | ERR
    (op #t #f)       | #f  | #t  | #t   | #f  | #t  | #f      | ERR | ERR
    (op #f #t)       | #f  | #t  | #t   | #f  | #t  | #t      | ERR | ERR
    (op #t #t)       | #t  | #t  | #f   | #f  | #f  | #t      | ERR | ERR
    (op 'a 'a)       | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 'a 'b)       | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op #f 0)        | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 'a 0)        | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 0 'a)        | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 1 #t)        | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 1 1 1 1)     | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 1 2 3 4)     | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op #f #f #f)    | #f  | #f  | #t   | #t  | #f  | ERR     | ERR | ERR
    (op #f #f #f #f) | #f  | #f  | #t   | #t  | #f  | ERR     | ERR | ERR
    (op #t #t #t)    | #t  | #t  | #f   | #f  | #t  | ERR     | ERR | ERR
    (op #t #f #t)    | #f  | #t  | #t   | #f  | #f  | ERR     | ERR | ERR
    (op 'a 'a 'a)    | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 'a 'b 'b)    | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 'a 'b 'c)    | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    (op 1 2 #t 1 'a) | ERR | ERR | ERR  | ERR | ERR | ERR     | ERR | ERR
    "
  `);
});

// these prolly need manual testing
// const listOps = ['cons', 'list', 'list*', 'car', 'cdr', 'first', 'rest', 'last', 'last-pair'];
// const valueEqualityOps = ['eq?', 'symbol=?', 'number=?', 'boolean=?'];
// const listEqualityOps = ['equal?'];
