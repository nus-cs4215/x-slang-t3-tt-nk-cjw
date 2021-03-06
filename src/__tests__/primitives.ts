import { print } from '../printer';
import { JsonSExpr, jsonRead, jsonPrint } from '../sexpr';
import { cases, formatTable, getOk, getErr } from '../utils';
import { exprCompileEvaluate, readExprCompileEvaluate } from '../utils/compile-and-eval';

function expectOpTable(ops: string[], tests: string[]) {
  const errorMap: Map<string, number> = new Map();
  const errors: string[] = [];
  const table = [
    ...tests.map((test) => [
      test,
      ...ops.map((op) =>
        cases(readExprCompileEvaluate(test.replace(/op/g, op)), print, (e) => {
          let e_str = JSON.stringify(e);
          if (e_str.startsWith('"error when evaluating precompiled fep: ')) {
            e_str = '"error when evaluating precompiled fep: <error message omitted>"';
          }
          if (errorMap.has(e_str)) {
            return 'ERR #' + errorMap.get(e_str)!.toString();
          } else {
            errorMap.set(e_str, errors.length);
            errors.push(e_str);
            return 'ERR #' + (errors.length - 1).toString();
          }
        })
      ),
    ]),
  ];

  const errorTable = errors.map((e, i) => [i.toString(), e]);

  return expect(
    formatTable(table, { headers: ['test', ...ops], sep: ' | ', prefix: '\n' }) +
      '\n' +
      formatTable(errorTable, { headers: ['#', 'error message'], sep: ' | ', prefix: '\n' })
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
  '(op 3 3)',
  '(op -1 3)',
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
    ['symbol?', 'number?', 'boolean?', 'null?', 'cons?', 'function?', 'nan?', 'infinite?'],
    [
      ...zeroArgTests,
      ...mixedTypesArgTests,
      ...oneListArgTests,

      // test for 'function?'
      '(op eq?)',
      '(op function?)',
      '(op (lambda (x) (f (f (f x)))))',
    ]
  ).toMatchInlineSnapshot(`
    "
    test                            | symbol? | number? | boolean? | null?  | cons?  | function? | nan?   | infinite?
    -----------------------------------------------------------------------------------------------------------------
    (op)                            | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 0)                          | #f      | #t      | #f       | #f     | #f     | #f        | #f     | #f
    (op +inf.0)                     | #f      | #t      | #f       | #f     | #f     | #f        | #f     | #t
    (op -inf.0)                     | #f      | #t      | #f       | #f     | #f     | #f        | #f     | #t
    (op +nan.0)                     | #f      | #t      | #f       | #f     | #f     | #f        | #t     | #f
    (op #f)                         | #f      | #f      | #t       | #f     | #f     | #f        | ERR #0 | ERR #0
    (op #t)                         | #f      | #f      | #t       | #f     | #f     | #f        | ERR #0 | ERR #0
    (op 'a)                         | #t      | #f      | #f       | #f     | #f     | #f        | ERR #0 | ERR #0
    (op 0 0)                        | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 1 0)                        | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 3 3)                        | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op -1 3)                       | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 3 5)                        | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #f #f)                      | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #t #f)                      | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #f #t)                      | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #t #t)                      | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 'a 'a)                      | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 'a 'b)                      | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #f 0)                       | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 'a 0)                       | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 0 'a)                       | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 1 #t)                       | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 1 1 1 1)                    | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 1 2 3 4)                    | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #f #f #f)                   | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #f #f #f #f)                | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #t #t #t)                   | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op #t #f #t)                   | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 'a 'a 'a)                   | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 'a 'b 'b)                   | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 'a 'b 'c)                   | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op 1 2 #t 1 'a)                | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0
    (op '())                        | #f      | #f      | #f       | #t     | #f     | #f        | ERR #0 | ERR #0
    (op '(1))                       | #f      | #f      | #f       | #f     | #t     | #f        | ERR #0 | ERR #0
    (op '(1 2))                     | #f      | #f      | #f       | #f     | #t     | #f        | ERR #0 | ERR #0
    (op '(1 2 3 4 5))               | #f      | #f      | #f       | #f     | #t     | #f        | ERR #0 | ERR #0
    (op '(1 #t))                    | #f      | #f      | #f       | #f     | #t     | #f        | ERR #0 | ERR #0
    (op eq?)                        | #f      | #f      | #f       | #f     | #f     | #t        | ERR #0 | ERR #0
    (op function?)                  | #f      | #f      | #f       | #f     | #f     | #t        | ERR #0 | ERR #0
    (op (lambda (x) (f (f (f x))))) | ERR #0  | ERR #0  | ERR #0   | ERR #0 | ERR #0 | ERR #0    | ERR #0 | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);
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
    [
      ...zeroArgTests,
      ...oneArgTests,
      ...mixedTypesArgTests,
      ...malformedArgTests,
      ...oneListArgTests,
    ]
  ).toMatchInlineSnapshot(`
    "
    test              | zero?   | positive? | negative? | round   | floor   | ceiling | truncate | sgn     | abs     | add1    | sub1    | exp                 | log
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    (op)              | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 0)            | #t      | #f        | #f        | 0       | 0       | 0       | 0        | 0       | 0       | 1       | -1      | 1                   | ERR #0
    (op 1)            | #f      | #t        | #f        | 1       | 1       | 1       | 1        | 1       | 1       | 2       | 0       | 2.718281828459045   | 0
    (op 2)            | #f      | #t        | #f        | 2       | 2       | 2       | 2        | 1       | 2       | 3       | 1       | 7.38905609893065    | 0.6931471805599453
    (op 0.1)          | #f      | #t        | #f        | 0       | 0       | 1       | 0        | 1       | 0.1     | 1.1     | -0.9    | 1.1051709180756477  | -2.3025850929940455
    (op 2.4)          | #f      | #t        | #f        | 2       | 2       | 3       | 2        | 1       | 2.4     | 3.4     | 1.4     | 11.023176380641601  | 0.8754687373538999
    (op 2.5)          | #f      | #t        | #f        | 3       | 2       | 3       | 2        | 1       | 2.5     | 3.5     | 1.5     | 12.182493960703473  | 0.9162907318741551
    (op 2.6)          | #f      | #t        | #f        | 3       | 2       | 3       | 2        | 1       | 2.6     | 3.6     | 1.6     | 13.463738035001692  | 0.9555114450274365
    (op -2.4)         | #f      | #f        | #t        | -2      | -3      | -2      | -2       | -1      | 2.4     | -1.4    | -3.4    | 0.09071795328941251 | +nan.0
    (op -2.5)         | #f      | #f        | #t        | -2      | -3      | -2      | -2       | -1      | 2.5     | -1.5    | -3.5    | 0.0820849986238988  | +nan.0
    (op -2.6)         | #f      | #f        | #t        | -3      | -3      | -2      | -2       | -1      | 2.6     | -1.6    | -3.6    | 0.07427357821433388 | +nan.0
    (op -1)           | #f      | #f        | #t        | -1      | -1      | -1      | -1       | -1      | 1       | 0       | -2      | 0.36787944117144233 | +nan.0
    (op -2)           | #f      | #f        | #t        | -2      | -2      | -2      | -2       | -1      | 2       | -1      | -3      | 0.1353352832366127  | +nan.0
    (op +inf.0)       | #f      | #t        | #f        | +inf.0  | +inf.0  | +inf.0  | +inf.0   | 1       | +inf.0  | +inf.0  | +inf.0  | +inf.0              | +inf.0
    (op -inf.0)       | #f      | #f        | #t        | -inf.0  | -inf.0  | -inf.0  | -inf.0   | -1      | +inf.0  | -inf.0  | -inf.0  | 0                   | +nan.0
    (op +nan.0)       | #f      | #f        | #f        | +nan.0  | +nan.0  | +nan.0  | +nan.0   | +nan.0  | +nan.0  | +nan.0  | +nan.0  | +nan.0              | +nan.0
    (op 0)            | #t      | #f        | #f        | 0       | 0       | 0       | 0        | 0       | 0       | 1       | -1      | 1                   | ERR #0
    (op +inf.0)       | #f      | #t        | #f        | +inf.0  | +inf.0  | +inf.0  | +inf.0   | 1       | +inf.0  | +inf.0  | +inf.0  | +inf.0              | +inf.0
    (op -inf.0)       | #f      | #f        | #t        | -inf.0  | -inf.0  | -inf.0  | -inf.0   | -1      | +inf.0  | -inf.0  | -inf.0  | 0                   | +nan.0
    (op +nan.0)       | #f      | #f        | #f        | +nan.0  | +nan.0  | +nan.0  | +nan.0   | +nan.0  | +nan.0  | +nan.0  | +nan.0  | +nan.0              | +nan.0
    (op #f)           | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #t)           | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a)           | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 0 0)          | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 1 0)          | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 3 3)          | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | 1
    (op -1 3)         | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | +nan.0
    (op 3 5)          | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | 0.6826061944859853
    (op #f #f)        | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #t #f)        | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #f #t)        | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #t #t)        | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a 'a)        | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a 'b)        | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #f 0)         | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a 0)         | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 0 'a)         | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 1 #t)         | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 1 1 1 1)      | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 1 2 3 4)      | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #f #f #f)     | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #f #f #f #f)  | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #t #t #t)     | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op #t #f #t)     | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a 'a 'a)     | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a 'b 'b)     | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 'a 'b 'c)     | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 1 2 #t 1 'a)  | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op 1 . 2)        | ERR #1  | ERR #2    | ERR #3    | ERR #4  | ERR #5  | ERR #6  | ERR #7   | ERR #8  | ERR #9  | ERR #10 | ERR #11 | ERR #12             | ERR #13
    (op . 1)          | ERR #14 | ERR #15   | ERR #16   | ERR #17 | ERR #18 | ERR #19 | ERR #20  | ERR #21 | ERR #22 | ERR #23 | ERR #24 | ERR #25             | ERR #26
    (op a)            | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op a a)          | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op ())           | ERR #27 | ERR #27   | ERR #27   | ERR #27 | ERR #27 | ERR #27 | ERR #27  | ERR #27 | ERR #27 | ERR #27 | ERR #27 | ERR #27             | ERR #27
    (op '())          | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op '(1))         | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op '(1 2))       | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op '(1 2 3 4 5)) | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0
    (op '(1 #t))      | ERR #0  | ERR #0    | ERR #0    | ERR #0  | ERR #0  | ERR #0  | ERR #0   | ERR #0  | ERR #0  | ERR #0  | ERR #0  | ERR #0              | ERR #0


    #  | error message
    ---------------------------------------------------------------------------
    0  | \\"error when evaluating precompiled fep: <error message omitted>\\"
    1  | \\"did not match pattern for #%plain-app: (#%plain-app zero? 1 . 2)\\"
    2  | \\"did not match pattern for #%plain-app: (#%plain-app positive? 1 . 2)\\"
    3  | \\"did not match pattern for #%plain-app: (#%plain-app negative? 1 . 2)\\"
    4  | \\"did not match pattern for #%plain-app: (#%plain-app round 1 . 2)\\"
    5  | \\"did not match pattern for #%plain-app: (#%plain-app floor 1 . 2)\\"
    6  | \\"did not match pattern for #%plain-app: (#%plain-app ceiling 1 . 2)\\"
    7  | \\"did not match pattern for #%plain-app: (#%plain-app truncate 1 . 2)\\"
    8  | \\"did not match pattern for #%plain-app: (#%plain-app sgn 1 . 2)\\"
    9  | \\"did not match pattern for #%plain-app: (#%plain-app abs 1 . 2)\\"
    10 | \\"did not match pattern for #%plain-app: (#%plain-app add1 1 . 2)\\"
    11 | \\"did not match pattern for #%plain-app: (#%plain-app sub1 1 . 2)\\"
    12 | \\"did not match pattern for #%plain-app: (#%plain-app exp 1 . 2)\\"
    13 | \\"did not match pattern for #%plain-app: (#%plain-app log 1 . 2)\\"
    14 | \\"did not match pattern for #%plain-app: (#%plain-app zero? . 1)\\"
    15 | \\"did not match pattern for #%plain-app: (#%plain-app positive? . 1)\\"
    16 | \\"did not match pattern for #%plain-app: (#%plain-app negative? . 1)\\"
    17 | \\"did not match pattern for #%plain-app: (#%plain-app round . 1)\\"
    18 | \\"did not match pattern for #%plain-app: (#%plain-app floor . 1)\\"
    19 | \\"did not match pattern for #%plain-app: (#%plain-app ceiling . 1)\\"
    20 | \\"did not match pattern for #%plain-app: (#%plain-app truncate . 1)\\"
    21 | \\"did not match pattern for #%plain-app: (#%plain-app sgn . 1)\\"
    22 | \\"did not match pattern for #%plain-app: (#%plain-app abs . 1)\\"
    23 | \\"did not match pattern for #%plain-app: (#%plain-app add1 . 1)\\"
    24 | \\"did not match pattern for #%plain-app: (#%plain-app sub1 . 1)\\"
    25 | \\"did not match pattern for #%plain-app: (#%plain-app exp . 1)\\"
    26 | \\"did not match pattern for #%plain-app: (#%plain-app log . 1)\\"
    27 | \\"did not match pattern for #%plain-app: (#%plain-app)\\"
    "
  `);
});

test('2 args log', () => {
  expectOpTable(['log'], [...twoNumArgTests]).toMatchInlineSnapshot(`
    "
    test               | log
    ---------------------------------------
    (op 0 0)           | ERR #0
    (op 1 0)           | ERR #0
    (op 0 1)           | ERR #0
    (op 1 1)           | ERR #0
    (op 3 5)           | 0.6826061944859853
    (op 5 3)           | 1.4649735207179273
    (op 0 +inf.0)      | ERR #0
    (op 1 +inf.0)      | 0
    (op 2 +inf.0)      | 0
    (op +inf.0 0)      | ERR #0
    (op +inf.0 1)      | ERR #0
    (op +inf.0 2)      | +inf.0
    (op +inf.0 +inf.0) | +nan.0
    (op 0.1 0)         | ERR #0
    (op 0 0.1)         | ERR #0
    (op 0.1 0.1)       | 1
    (op 0.3 0.5)       | 1.7369655941662063
    (op 0.5 0.3)       | 0.5757166424934449
    (op 3 5)           | 0.6826061944859853
    (op -3 5)          | +nan.0
    (op 3 -5)          | +nan.0
    (op -3 -5)         | +nan.0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);
});

test('exactly binary numeric ops', () => {
  expectOpTable(['quotient', 'remainder', 'modulo', 'expt'], [...mixedTypesArgTests])
    .toMatchInlineSnapshot(`
    "
    test             | quotient | remainder | modulo | expt
    ---------------------------------------------------------
    (op 0)           | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op +inf.0)      | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op -inf.0)      | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op +nan.0)      | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #f)          | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #t)          | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a)          | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 0 0)         | ERR #0   | ERR #0    | ERR #0 | 1
    (op 1 0)         | ERR #0   | ERR #0    | ERR #0 | 1
    (op 3 3)         | 1        | 0         | 0      | 27
    (op -1 3)        | 0        | -1        | 2      | -1
    (op 3 5)         | 0        | 3         | 3      | 243
    (op #f #f)       | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #t #f)       | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #f #t)       | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #t #t)       | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a 'a)       | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a 'b)       | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #f 0)        | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a 0)        | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 0 'a)        | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 1 #t)        | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 1 1 1 1)     | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 1 2 3 4)     | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #f #f #f)    | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #f #f #f #f) | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #t #t #t)    | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op #t #f #t)    | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a 'a 'a)    | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a 'b 'b)    | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 'a 'b 'c)    | ERR #0   | ERR #0    | ERR #0 | ERR #0
    (op 1 2 #t 1 'a) | ERR #0   | ERR #0    | ERR #0 | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
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
    test               | +       | -       | *                    | /                    | max     | min
    --------------------------------------------------------------------------------------------------------
    (op)               | 0       | ERR #0  | 1                    | ERR #0               | -inf.0  | +inf.0
    (op 0)             | 0       | 0       | 0                    | ERR #0               | 0       | 0
    (op 1)             | 1       | -1      | 1                    | 1                    | 1       | 1
    (op 2)             | 2       | -2      | 2                    | 0.5                  | 2       | 2
    (op 0.1)           | 0.1     | -0.1    | 0.1                  | 10                   | 0.1     | 0.1
    (op 2.4)           | 2.4     | -2.4    | 2.4                  | 0.4166666666666667   | 2.4     | 2.4
    (op 2.5)           | 2.5     | -2.5    | 2.5                  | 0.4                  | 2.5     | 2.5
    (op 2.6)           | 2.6     | -2.6    | 2.6                  | 0.3846153846153846   | 2.6     | 2.6
    (op -2.4)          | -2.4    | 2.4     | -2.4                 | -0.4166666666666667  | -2.4    | -2.4
    (op -2.5)          | -2.5    | 2.5     | -2.5                 | -0.4                 | -2.5    | -2.5
    (op -2.6)          | -2.6    | 2.6     | -2.6                 | -0.3846153846153846  | -2.6    | -2.6
    (op -1)            | -1      | 1       | -1                   | -1                   | -1      | -1
    (op -2)            | -2      | 2       | -2                   | -0.5                 | -2      | -2
    (op +inf.0)        | +inf.0  | -inf.0  | +inf.0               | 0                    | +inf.0  | +inf.0
    (op -inf.0)        | -inf.0  | +inf.0  | -inf.0               | 0                    | -inf.0  | -inf.0
    (op +nan.0)        | +nan.0  | +nan.0  | +nan.0               | +nan.0               | +nan.0  | +nan.0
    (op 0 0)           | 0       | 0       | 0                    | ERR #0               | 0       | 0
    (op 1 0)           | 1       | 1       | 0                    | ERR #0               | 1       | 0
    (op 0 1)           | 1       | -1      | 0                    | 0                    | 1       | 0
    (op 1 1)           | 2       | 0       | 1                    | 1                    | 1       | 1
    (op 3 5)           | 8       | -2      | 15                   | 0.6                  | 5       | 3
    (op 5 3)           | 8       | 2       | 15                   | 1.6666666666666667   | 5       | 3
    (op 0 +inf.0)      | +inf.0  | -inf.0  | +nan.0               | 0                    | +inf.0  | 0
    (op 1 +inf.0)      | +inf.0  | -inf.0  | +inf.0               | 0                    | +inf.0  | 1
    (op 2 +inf.0)      | +inf.0  | -inf.0  | +inf.0               | 0                    | +inf.0  | 2
    (op +inf.0 0)      | +inf.0  | +inf.0  | +nan.0               | ERR #0               | +inf.0  | 0
    (op +inf.0 1)      | +inf.0  | +inf.0  | +inf.0               | +inf.0               | +inf.0  | 1
    (op +inf.0 2)      | +inf.0  | +inf.0  | +inf.0               | +inf.0               | +inf.0  | 2
    (op +inf.0 +inf.0) | +inf.0  | +nan.0  | +inf.0               | +nan.0               | +inf.0  | +inf.0
    (op 0.1 0)         | 0.1     | 0.1     | 0                    | ERR #0               | 0.1     | 0
    (op 0 0.1)         | 0.1     | -0.1    | 0                    | 0                    | 0.1     | 0
    (op 0.1 0.1)       | 0.2     | 0       | 0.010000000000000002 | 1                    | 0.1     | 0.1
    (op 0.3 0.5)       | 0.8     | -0.2    | 0.15                 | 0.6                  | 0.5     | 0.3
    (op 0.5 0.3)       | 0.8     | 0.2     | 0.15                 | 1.6666666666666667   | 0.5     | 0.3
    (op 3 5)           | 8       | -2      | 15                   | 0.6                  | 5       | 3
    (op -3 5)          | 2       | -8      | -15                  | -0.6                 | 5       | -3
    (op 3 -5)          | -2      | 8       | -15                  | -0.6                 | 3       | -5
    (op -3 -5)         | -8      | 2       | 15                   | 0.6                  | -3      | -5
    (op 1 1 1 1 1)     | 5       | -3      | 1                    | 1                    | 1       | 1
    (op 2 2 2 1 1)     | 8       | -4      | 8                    | 0.5                  | 2       | 1
    (op 1 1 1 2 2)     | 7       | -5      | 4                    | 0.25                 | 2       | 1
    (op 1 4 3 5 2)     | 15      | -13     | 120                  | 0.008333333333333333 | 5       | 1
    (op 1 2 3 4 4)     | 14      | -12     | 96                   | 0.010416666666666666 | 4       | 1
    (op 4 4 3 2 1)     | 14      | -6      | 96                   | 0.16666666666666666  | 4       | 1
    (op 11 13 17)      | 41      | -19     | 2431                 | 0.049773755656108594 | 17      | 11
    (op 1 2 3 4 5)     | 15      | -13     | 120                  | 0.008333333333333333 | 5       | 1
    (op 5 4 3 2 1)     | 15      | -5      | 120                  | 0.20833333333333334  | 5       | 1
    (op 0)             | 0       | 0       | 0                    | ERR #0               | 0       | 0
    (op +inf.0)        | +inf.0  | -inf.0  | +inf.0               | 0                    | +inf.0  | +inf.0
    (op -inf.0)        | -inf.0  | +inf.0  | -inf.0               | 0                    | -inf.0  | -inf.0
    (op +nan.0)        | +nan.0  | +nan.0  | +nan.0               | +nan.0               | +nan.0  | +nan.0
    (op #f)            | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #t)            | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a)            | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 0 0)           | 0       | 0       | 0                    | ERR #0               | 0       | 0
    (op 1 0)           | 1       | 1       | 0                    | ERR #0               | 1       | 0
    (op 3 3)           | 6       | 0       | 9                    | 1                    | 3       | 3
    (op -1 3)          | 2       | -4      | -3                   | -0.3333333333333333  | 3       | -1
    (op 3 5)           | 8       | -2      | 15                   | 0.6                  | 5       | 3
    (op #f #f)         | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #t #f)         | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #f #t)         | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #t #t)         | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a 'a)         | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a 'b)         | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #f 0)          | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a 0)          | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 0 'a)          | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 1 #t)          | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 1 1 1 1)       | 4       | -2      | 1                    | 1                    | 1       | 1
    (op 1 2 3 4)       | 10      | -8      | 24                   | 0.041666666666666664 | 4       | 1
    (op #f #f #f)      | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #f #f #f #f)   | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #t #t #t)      | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op #t #f #t)      | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a 'a 'a)      | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a 'b 'b)      | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 'a 'b 'c)      | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 1 2 #t 1 'a)   | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op 1 . 2)         | ERR #1  | ERR #2  | ERR #3               | ERR #4               | ERR #5  | ERR #6
    (op . 1)           | ERR #7  | ERR #8  | ERR #9               | ERR #10              | ERR #11 | ERR #12
    (op a)             | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op a a)           | ERR #0  | ERR #0  | ERR #0               | ERR #0               | ERR #0  | ERR #0
    (op ())            | ERR #13 | ERR #13 | ERR #13              | ERR #13              | ERR #13 | ERR #13
    (op (op 1 2) 3)    | 6       | -4      | 6                    | 0.16666666666666666  | 3       | 1
    (op 1 (op 2 3))    | 6       | 2       | 6                    | 1.5                  | 3       | 1


    #  | error message
    ---------------------------------------------------------------------
    0  | \\"error when evaluating precompiled fep: <error message omitted>\\"
    1  | \\"did not match pattern for #%plain-app: (#%plain-app + 1 . 2)\\"
    2  | \\"did not match pattern for #%plain-app: (#%plain-app - 1 . 2)\\"
    3  | \\"did not match pattern for #%plain-app: (#%plain-app * 1 . 2)\\"
    4  | \\"did not match pattern for #%plain-app: (#%plain-app / 1 . 2)\\"
    5  | \\"did not match pattern for #%plain-app: (#%plain-app max 1 . 2)\\"
    6  | \\"did not match pattern for #%plain-app: (#%plain-app min 1 . 2)\\"
    7  | \\"did not match pattern for #%plain-app: (#%plain-app + . 1)\\"
    8  | \\"did not match pattern for #%plain-app: (#%plain-app - . 1)\\"
    9  | \\"did not match pattern for #%plain-app: (#%plain-app * . 1)\\"
    10 | \\"did not match pattern for #%plain-app: (#%plain-app / . 1)\\"
    11 | \\"did not match pattern for #%plain-app: (#%plain-app max . 1)\\"
    12 | \\"did not match pattern for #%plain-app: (#%plain-app min . 1)\\"
    13 | \\"did not match pattern for #%plain-app: (#%plain-app)\\"
    "
  `);
});

test('numeric comparsion ops', () => {
  expectOpTable(
    ['=', '<', '>', '<=', '>='],
    [...zeroArgTests, '(op 0)', ...twoNumArgTests, ...manyNumArgTests, ...mixedTypesArgTests]
  ).toMatchInlineSnapshot(`
    "
    test               | =      | <      | >      | <=     | >=
    ---------------------------------------------------------------
    (op)               | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 0)             | #t     | #t     | #t     | #t     | #t
    (op 0 0)           | #t     | #f     | #f     | #t     | #t
    (op 1 0)           | #f     | #f     | #t     | #f     | #t
    (op 0 1)           | #f     | #t     | #f     | #t     | #f
    (op 1 1)           | #t     | #f     | #f     | #t     | #t
    (op 3 5)           | #f     | #t     | #f     | #t     | #f
    (op 5 3)           | #f     | #f     | #t     | #f     | #t
    (op 0 +inf.0)      | #f     | #t     | #f     | #t     | #f
    (op 1 +inf.0)      | #f     | #t     | #f     | #t     | #f
    (op 2 +inf.0)      | #f     | #t     | #f     | #t     | #f
    (op +inf.0 0)      | #f     | #f     | #t     | #f     | #t
    (op +inf.0 1)      | #f     | #f     | #t     | #f     | #t
    (op +inf.0 2)      | #f     | #f     | #t     | #f     | #t
    (op +inf.0 +inf.0) | #t     | #f     | #f     | #t     | #t
    (op 0.1 0)         | #f     | #f     | #t     | #f     | #t
    (op 0 0.1)         | #f     | #t     | #f     | #t     | #f
    (op 0.1 0.1)       | #t     | #f     | #f     | #t     | #t
    (op 0.3 0.5)       | #f     | #t     | #f     | #t     | #f
    (op 0.5 0.3)       | #f     | #f     | #t     | #f     | #t
    (op 3 5)           | #f     | #t     | #f     | #t     | #f
    (op -3 5)          | #f     | #t     | #f     | #t     | #f
    (op 3 -5)          | #f     | #f     | #t     | #f     | #t
    (op -3 -5)         | #f     | #f     | #t     | #f     | #t
    (op 1 1 1 1 1)     | #t     | #f     | #f     | #t     | #t
    (op 2 2 2 1 1)     | #f     | #f     | #f     | #f     | #t
    (op 1 1 1 2 2)     | #f     | #f     | #f     | #t     | #f
    (op 1 4 3 5 2)     | #f     | #f     | #f     | #f     | #f
    (op 1 2 3 4 4)     | #f     | #f     | #f     | #t     | #f
    (op 4 4 3 2 1)     | #f     | #f     | #f     | #f     | #t
    (op 11 13 17)      | #f     | #t     | #f     | #t     | #f
    (op 1 2 3 4 5)     | #f     | #t     | #f     | #t     | #f
    (op 5 4 3 2 1)     | #f     | #f     | #t     | #f     | #t
    (op 0)             | #t     | #t     | #t     | #t     | #t
    (op +inf.0)        | #t     | #t     | #t     | #t     | #t
    (op -inf.0)        | #t     | #t     | #t     | #t     | #t
    (op +nan.0)        | #t     | #t     | #t     | #t     | #t
    (op #f)            | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #t)            | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a)            | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 0 0)           | #t     | #f     | #f     | #t     | #t
    (op 1 0)           | #f     | #f     | #t     | #f     | #t
    (op 3 3)           | #t     | #f     | #f     | #t     | #t
    (op -1 3)          | #f     | #t     | #f     | #t     | #f
    (op 3 5)           | #f     | #t     | #f     | #t     | #f
    (op #f #f)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #t #f)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #f #t)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #t #t)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'a)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'b)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #f 0)          | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 0)          | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 0 'a)          | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 #t)          | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 1 1 1)       | #t     | #f     | #f     | #t     | #t
    (op 1 2 3 4)       | #f     | #t     | #f     | #t     | #f
    (op #f #f #f)      | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #f #f #f #f)   | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #t #t #t)      | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #t #f #t)      | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'a 'a)      | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'b 'b)      | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'b 'c)      | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 2 #t 1 'a)   | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);
});

test('trigonometric ops', () => {
  // ,
  expectOpTable(
    ['sin', 'cos', 'tan'],
    [
      ...zeroArgTests,
      '(op (* (/ -2 1) pi))',
      '(op (* (/ -1 1) pi))',
      '(op (* (/ -1 2) pi))',
      '(op (* (/ -1 3) pi))',
      '(op (* (/ -1 4) pi))',
      '(op (* (/ -1 6) pi))',
      '(op 0)',
      '(op (* (/ 1 6) pi))',
      '(op (* (/ 1 4) pi))',
      '(op (* (/ 1 3) pi))',
      '(op (* (/ 1 2) pi))',
      '(op (* (/ 1 1) pi))',
      '(op (* (/ 2 1) pi))',
      ...mixedTypesArgTests,
    ]
  ).toMatchInlineSnapshot(`
    "
    test                 | sin                     | cos                   | tan
    ------------------------------------------------------------------------------------------------
    (op)                 | ERR #0                  | ERR #0                | ERR #0
    (op (* (/ -2 1) pi)) | 2.4492935982947064e-16  | 1                     | 2.4492935982947064e-16
    (op (* (/ -1 1) pi)) | -1.2246467991473532e-16 | -1                    | 1.2246467991473532e-16
    (op (* (/ -1 2) pi)) | -1                      | 6.123233995736766e-17 | -16331239353195370
    (op (* (/ -1 3) pi)) | -0.8660254037844386     | 0.5000000000000001    | -1.7320508075688767
    (op (* (/ -1 4) pi)) | -0.7071067811865475     | 0.7071067811865476    | -0.9999999999999999
    (op (* (/ -1 6) pi)) | -0.49999999999999994    | 0.8660254037844387    | -0.5773502691896257
    (op 0)               | 0                       | 1                     | 0
    (op (* (/ 1 6) pi))  | 0.49999999999999994     | 0.8660254037844387    | 0.5773502691896257
    (op (* (/ 1 4) pi))  | 0.7071067811865475      | 0.7071067811865476    | 0.9999999999999999
    (op (* (/ 1 3) pi))  | 0.8660254037844386      | 0.5000000000000001    | 1.7320508075688767
    (op (* (/ 1 2) pi))  | 1                       | 6.123233995736766e-17 | 16331239353195370
    (op (* (/ 1 1) pi))  | 1.2246467991473532e-16  | -1                    | -1.2246467991473532e-16
    (op (* (/ 2 1) pi))  | -2.4492935982947064e-16 | 1                     | -2.4492935982947064e-16
    (op 0)               | 0                       | 1                     | 0
    (op +inf.0)          | +nan.0                  | +nan.0                | +nan.0
    (op -inf.0)          | +nan.0                  | +nan.0                | +nan.0
    (op +nan.0)          | +nan.0                  | +nan.0                | +nan.0
    (op #f)              | ERR #0                  | ERR #0                | ERR #0
    (op #t)              | ERR #0                  | ERR #0                | ERR #0
    (op 'a)              | ERR #0                  | ERR #0                | ERR #0
    (op 0 0)             | ERR #0                  | ERR #0                | ERR #0
    (op 1 0)             | ERR #0                  | ERR #0                | ERR #0
    (op 3 3)             | ERR #0                  | ERR #0                | ERR #0
    (op -1 3)            | ERR #0                  | ERR #0                | ERR #0
    (op 3 5)             | ERR #0                  | ERR #0                | ERR #0
    (op #f #f)           | ERR #0                  | ERR #0                | ERR #0
    (op #t #f)           | ERR #0                  | ERR #0                | ERR #0
    (op #f #t)           | ERR #0                  | ERR #0                | ERR #0
    (op #t #t)           | ERR #0                  | ERR #0                | ERR #0
    (op 'a 'a)           | ERR #0                  | ERR #0                | ERR #0
    (op 'a 'b)           | ERR #0                  | ERR #0                | ERR #0
    (op #f 0)            | ERR #0                  | ERR #0                | ERR #0
    (op 'a 0)            | ERR #0                  | ERR #0                | ERR #0
    (op 0 'a)            | ERR #0                  | ERR #0                | ERR #0
    (op 1 #t)            | ERR #0                  | ERR #0                | ERR #0
    (op 1 1 1 1)         | ERR #0                  | ERR #0                | ERR #0
    (op 1 2 3 4)         | ERR #0                  | ERR #0                | ERR #0
    (op #f #f #f)        | ERR #0                  | ERR #0                | ERR #0
    (op #f #f #f #f)     | ERR #0                  | ERR #0                | ERR #0
    (op #t #t #t)        | ERR #0                  | ERR #0                | ERR #0
    (op #t #f #t)        | ERR #0                  | ERR #0                | ERR #0
    (op 'a 'a 'a)        | ERR #0                  | ERR #0                | ERR #0
    (op 'a 'b 'b)        | ERR #0                  | ERR #0                | ERR #0
    (op 'a 'b 'c)        | ERR #0                  | ERR #0                | ERR #0
    (op 1 2 #t 1 'a)     | ERR #0                  | ERR #0                | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);

  expectOpTable(
    ['asin', 'acos', 'atan'],
    [
      ...zeroArgTests,
      '(/ (op -2) pi)',
      '(/ (op -1) pi)',
      '(/ (op -0.8660254037844387) pi)',
      '(/ (op -0.7071067811865476) pi)',
      '(/ (op -0.5000000000000001) pi)',
      '(/ (op 0) pi)',
      '(/ (op 0.5000000000000001) pi)',
      '(/ (op 0.7071067811865476) pi)',
      '(/ (op 1) pi)',
      '(/ (op 2) pi)',
      ...mixedTypesArgTests,
    ]
  ).toMatchInlineSnapshot(`
    "
    test                            | asin                 | acos               | atan
    --------------------------------------------------------------------------------------------------
    (op)                            | ERR #0               | ERR #0             | ERR #0
    (/ (op -2) pi)                  | +nan.0               | +nan.0             | -0.35241638234956674
    (/ (op -1) pi)                  | -0.5                 | 1                  | -0.25
    (/ (op -0.8660254037844387) pi) | -0.33333333333333337 | 0.8333333333333334 | -0.22718552582850507
    (/ (op -0.7071067811865476) pi) | -0.25000000000000006 | 0.75               | -0.19591327601530364
    (/ (op -0.5000000000000001) pi) | -0.1666666666666667  | 0.6666666666666667 | -0.14758361765043332
    (/ (op 0) pi)                   | 0                    | 0.5                | 0
    (/ (op 0.5000000000000001) pi)  | 0.1666666666666667   | 0.3333333333333333 | 0.14758361765043332
    (/ (op 0.7071067811865476) pi)  | 0.25000000000000006  | 0.25               | 0.19591327601530364
    (/ (op 1) pi)                   | 0.5                  | 0                  | 0.25
    (/ (op 2) pi)                   | +nan.0               | +nan.0             | 0.35241638234956674
    (op 0)                          | 0                    | 1.5707963267948966 | 0
    (op +inf.0)                     | +nan.0               | +nan.0             | 1.5707963267948966
    (op -inf.0)                     | +nan.0               | +nan.0             | -1.5707963267948966
    (op +nan.0)                     | +nan.0               | +nan.0             | +nan.0
    (op #f)                         | ERR #0               | ERR #0             | ERR #0
    (op #t)                         | ERR #0               | ERR #0             | ERR #0
    (op 'a)                         | ERR #0               | ERR #0             | ERR #0
    (op 0 0)                        | ERR #0               | ERR #0             | 0
    (op 1 0)                        | ERR #0               | ERR #0             | 1.5707963267948966
    (op 3 3)                        | ERR #0               | ERR #0             | 0.7853981633974483
    (op -1 3)                       | ERR #0               | ERR #0             | -0.3217505543966422
    (op 3 5)                        | ERR #0               | ERR #0             | 0.5404195002705842
    (op #f #f)                      | ERR #0               | ERR #0             | ERR #0
    (op #t #f)                      | ERR #0               | ERR #0             | ERR #0
    (op #f #t)                      | ERR #0               | ERR #0             | ERR #0
    (op #t #t)                      | ERR #0               | ERR #0             | ERR #0
    (op 'a 'a)                      | ERR #0               | ERR #0             | ERR #0
    (op 'a 'b)                      | ERR #0               | ERR #0             | ERR #0
    (op #f 0)                       | ERR #0               | ERR #0             | ERR #0
    (op 'a 0)                       | ERR #0               | ERR #0             | ERR #0
    (op 0 'a)                       | ERR #0               | ERR #0             | ERR #0
    (op 1 #t)                       | ERR #0               | ERR #0             | ERR #0
    (op 1 1 1 1)                    | ERR #0               | ERR #0             | ERR #0
    (op 1 2 3 4)                    | ERR #0               | ERR #0             | ERR #0
    (op #f #f #f)                   | ERR #0               | ERR #0             | ERR #0
    (op #f #f #f #f)                | ERR #0               | ERR #0             | ERR #0
    (op #t #t #t)                   | ERR #0               | ERR #0             | ERR #0
    (op #t #f #t)                   | ERR #0               | ERR #0             | ERR #0
    (op 'a 'a 'a)                   | ERR #0               | ERR #0             | ERR #0
    (op 'a 'b 'b)                   | ERR #0               | ERR #0             | ERR #0
    (op 'a 'b 'c)                   | ERR #0               | ERR #0             | ERR #0
    (op 1 2 #t 1 'a)                | ERR #0               | ERR #0             | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);

  expectOpTable(
    ['sinh', 'cosh', 'tanh'],
    [
      ...zeroArgTests,
      '(op 0)',
      '(op 1)',
      '(* 0.5 (- (exp 1) (exp -1)))',
      '(* 0.5 (+ (exp 1) (exp -1)))',
      '(/ (- (exp 1) (exp -1)) (+ (exp 1) (exp -1)))',
      ...mixedTypesArgTests,
    ]
  ).toMatchInlineSnapshot(`
    "
    test                                          | sinh               | cosh               | tanh
    ------------------------------------------------------------------------------------------------------------
    (op)                                          | ERR #0             | ERR #0             | ERR #0
    (op 0)                                        | 0                  | 1                  | 0
    (op 1)                                        | 1.1752011936438014 | 1.5430806348152437 | 0.7615941559557649
    (* 0.5 (- (exp 1) (exp -1)))                  | 1.1752011936438014 | 1.1752011936438014 | 1.1752011936438014
    (* 0.5 (+ (exp 1) (exp -1)))                  | 1.5430806348152437 | 1.5430806348152437 | 1.5430806348152437
    (/ (- (exp 1) (exp -1)) (+ (exp 1) (exp -1))) | 0.7615941559557649 | 0.7615941559557649 | 0.7615941559557649
    (op 0)                                        | 0                  | 1                  | 0
    (op +inf.0)                                   | +inf.0             | +inf.0             | 1
    (op -inf.0)                                   | -inf.0             | +inf.0             | -1
    (op +nan.0)                                   | +nan.0             | +nan.0             | +nan.0
    (op #f)                                       | ERR #0             | ERR #0             | ERR #0
    (op #t)                                       | ERR #0             | ERR #0             | ERR #0
    (op 'a)                                       | ERR #0             | ERR #0             | ERR #0
    (op 0 0)                                      | ERR #0             | ERR #0             | ERR #0
    (op 1 0)                                      | ERR #0             | ERR #0             | ERR #0
    (op 3 3)                                      | ERR #0             | ERR #0             | ERR #0
    (op -1 3)                                     | ERR #0             | ERR #0             | ERR #0
    (op 3 5)                                      | ERR #0             | ERR #0             | ERR #0
    (op #f #f)                                    | ERR #0             | ERR #0             | ERR #0
    (op #t #f)                                    | ERR #0             | ERR #0             | ERR #0
    (op #f #t)                                    | ERR #0             | ERR #0             | ERR #0
    (op #t #t)                                    | ERR #0             | ERR #0             | ERR #0
    (op 'a 'a)                                    | ERR #0             | ERR #0             | ERR #0
    (op 'a 'b)                                    | ERR #0             | ERR #0             | ERR #0
    (op #f 0)                                     | ERR #0             | ERR #0             | ERR #0
    (op 'a 0)                                     | ERR #0             | ERR #0             | ERR #0
    (op 0 'a)                                     | ERR #0             | ERR #0             | ERR #0
    (op 1 #t)                                     | ERR #0             | ERR #0             | ERR #0
    (op 1 1 1 1)                                  | ERR #0             | ERR #0             | ERR #0
    (op 1 2 3 4)                                  | ERR #0             | ERR #0             | ERR #0
    (op #f #f #f)                                 | ERR #0             | ERR #0             | ERR #0
    (op #f #f #f #f)                              | ERR #0             | ERR #0             | ERR #0
    (op #t #t #t)                                 | ERR #0             | ERR #0             | ERR #0
    (op #t #f #t)                                 | ERR #0             | ERR #0             | ERR #0
    (op 'a 'a 'a)                                 | ERR #0             | ERR #0             | ERR #0
    (op 'a 'b 'b)                                 | ERR #0             | ERR #0             | ERR #0
    (op 'a 'b 'c)                                 | ERR #0             | ERR #0             | ERR #0
    (op 1 2 #t 1 'a)                              | ERR #0             | ERR #0             | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);
});

test('2 arg atan', () => {
  expectOpTable(
    ['atan'],
    [
      ...zeroArgTests,
      '(/ (op 0 0) pi)',
      '(/ (op 0 1) pi)',
      '(/ (op 1 1) pi)',
      '(/ (op 1 0) pi)',
      '(/ (op 1 -1) pi)',
      '(/ (op 0 -1) pi)',
      '(/ (op -1 -1) pi)',
      '(/ (op -1 0) pi)',
      '(/ (op -1 1) pi)',
      ...mixedTypesArgTests,
    ]
  ).toMatchInlineSnapshot(`
    "
    test              | atan
    ---------------------------------------
    (op)              | ERR #0
    (/ (op 0 0) pi)   | 0
    (/ (op 0 1) pi)   | 0
    (/ (op 1 1) pi)   | 0.25
    (/ (op 1 0) pi)   | 0.5
    (/ (op 1 -1) pi)  | 0.75
    (/ (op 0 -1) pi)  | 1
    (/ (op -1 -1) pi) | -0.75
    (/ (op -1 0) pi)  | -0.5
    (/ (op -1 1) pi)  | -0.25
    (op 0)            | 0
    (op +inf.0)       | 1.5707963267948966
    (op -inf.0)       | -1.5707963267948966
    (op +nan.0)       | +nan.0
    (op #f)           | ERR #0
    (op #t)           | ERR #0
    (op 'a)           | ERR #0
    (op 0 0)          | 0
    (op 1 0)          | 1.5707963267948966
    (op 3 3)          | 0.7853981633974483
    (op -1 3)         | -0.3217505543966422
    (op 3 5)          | 0.5404195002705842
    (op #f #f)        | ERR #0
    (op #t #f)        | ERR #0
    (op #f #t)        | ERR #0
    (op #t #t)        | ERR #0
    (op 'a 'a)        | ERR #0
    (op 'a 'b)        | ERR #0
    (op #f 0)         | ERR #0
    (op 'a 0)         | ERR #0
    (op 0 'a)         | ERR #0
    (op 1 #t)         | ERR #0
    (op 1 1 1 1)      | ERR #0
    (op 1 2 3 4)      | ERR #0
    (op #f #f #f)     | ERR #0
    (op #f #f #f #f)  | ERR #0
    (op #t #t #t)     | ERR #0
    (op #t #f #t)     | ERR #0
    (op 'a 'a 'a)     | ERR #0
    (op 'a 'b 'b)     | ERR #0
    (op 'a 'b 'c)     | ERR #0
    (op 1 2 #t 1 'a)  | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);
});

// TODO: Implement and/or properly
test('boolean ops', () => {
  expectOpTable(['and', 'or', 'xor', 'not', 'false?'], [...mixedTypesArgTests])
    .toMatchInlineSnapshot(`
    "
    test             | and    | or     | xor    | not    | false?
    -------------------------------------------------------------
    (op 0)           | ERR #0 | ERR #0 | ERR #0 | #f     | #f
    (op +inf.0)      | ERR #0 | ERR #0 | ERR #0 | #f     | #f
    (op -inf.0)      | ERR #0 | ERR #0 | ERR #0 | #f     | #f
    (op +nan.0)      | ERR #0 | ERR #0 | ERR #0 | #f     | #f
    (op #f)          | ERR #0 | ERR #0 | #f     | #t     | #t
    (op #t)          | ERR #0 | ERR #0 | #t     | #f     | #f
    (op 'a)          | ERR #0 | ERR #0 | ERR #0 | #f     | #f
    (op 0 0)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 0)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 3 3)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op -1 3)        | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 3 5)         | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #f #f)       | ERR #0 | ERR #0 | #f     | ERR #0 | ERR #0
    (op #t #f)       | ERR #0 | ERR #0 | #t     | ERR #0 | ERR #0
    (op #f #t)       | ERR #0 | ERR #0 | #t     | ERR #0 | ERR #0
    (op #t #t)       | ERR #0 | ERR #0 | #f     | ERR #0 | ERR #0
    (op 'a 'a)       | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'b)       | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #f 0)        | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 0)        | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 0 'a)        | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 #t)        | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 1 1 1)     | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 2 3 4)     | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op #f #f #f)    | ERR #0 | ERR #0 | #f     | ERR #0 | ERR #0
    (op #f #f #f #f) | ERR #0 | ERR #0 | #f     | ERR #0 | ERR #0
    (op #t #t #t)    | ERR #0 | ERR #0 | #t     | ERR #0 | ERR #0
    (op #t #f #t)    | ERR #0 | ERR #0 | #f     | ERR #0 | ERR #0
    (op 'a 'a 'a)    | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'b 'b)    | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 'a 'b 'c)    | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0
    (op 1 2 #t 1 'a) | ERR #0 | ERR #0 | ERR #0 | ERR #0 | ERR #0


    # | error message
    --------------------------------------------------------------------
    0 | \\"error when evaluating precompiled fep: <error message omitted>\\"
    "
  `);
});

/// MANUAL TESTS ///

// Test utils
function expectJsonReadEvalPrint(j: JsonSExpr) {
  return expect(jsonPrint(getOk(exprCompileEvaluate(jsonRead(j)))));
}

function expectJsonReadEvalError(j: JsonSExpr) {
  return expect(getErr(exprCompileEvaluate(jsonRead(j))));
}

// const listOps = ['first', 'rest', 'last-pair'];
describe('listOps', () => {
  test('valid cons', () => {
    expectJsonReadEvalPrint(['cons', 1, 1]).toMatchInlineSnapshot(`
      Array [
        1,
        ".",
        1,
      ]
    `);

    expectJsonReadEvalPrint(['cons', 1, ['list']]).toMatchInlineSnapshot(`
      Array [
        1,
      ]
    `);
  });

  test('invalid cons', () => {
    expectJsonReadEvalError(['cons']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: cons: expected exactly 2 argument but got "`
    );
  });

  test('valid list', () => {
    expectJsonReadEvalPrint(['list', 1, 1]).toMatchInlineSnapshot(`
      Array [
        1,
        1,
      ]
    `);

    expectJsonReadEvalPrint(['list', 1, ['list', 1]]).toMatchInlineSnapshot(`
      Array [
        1,
        Array [
          1,
        ],
      ]
    `);

    expectJsonReadEvalPrint(['list']).toMatchInlineSnapshot(`Array []`);
  });

  test('valid list*', () => {
    expectJsonReadEvalPrint(['list*', 1, 1]).toMatchInlineSnapshot(`
      Array [
        1,
        ".",
        1,
      ]
    `);

    expectJsonReadEvalPrint(['list*', 1]).toMatchInlineSnapshot(`1`);
  });

  test('invalid list*', () => {
    expectJsonReadEvalError(['list*']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: list*: expected at least 1 argument"`
    );
  });

  test('valid car', () => {
    expectJsonReadEvalPrint(['car', ['quote', ['a']]]).toMatchInlineSnapshot(`"a"`);
  });

  test('invalid car', () => {
    expectJsonReadEvalError(['car', ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected argument to be list but got a"`
    );
    expectJsonReadEvalError(['car', 1]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected argument to be list but got 1"`
    );
    expectJsonReadEvalError(['car', true]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected argument to be list but got #t"`
    );
    expectJsonReadEvalError(['car', ['quote', []]]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected argument to be list but got ()"`
    );
    expectJsonReadEvalError(['car']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected exactly 1 argument but got "`
    );
    expectJsonReadEvalError(['car', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected exactly 1 argument but got a, a"`
    );
  });

  test('valid cdr', () => {
    expectJsonReadEvalPrint(['cdr', ['quote', ['a']]]).toMatchInlineSnapshot(`Array []`);
  });

  test('invalid cdr', () => {
    expectJsonReadEvalError(['cdr', ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: cdr: expected argument to be list but got a"`
    );
    expectJsonReadEvalError(['cdr', 1]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: cdr: expected argument to be list but got 1"`
    );
    expectJsonReadEvalError(['cdr', true]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: cdr: expected argument to be list but got #t"`
    );
    expectJsonReadEvalError(['cdr', ['quote', []]]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: cdr: expected argument to be list but got ()"`
    );
    expectJsonReadEvalError(['cdr']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected exactly 1 argument but got "`
    );
    expectJsonReadEvalError(['cdr', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: car: expected exactly 1 argument but got a, a"`
    );
  });

  test('valid first', () => {
    expectJsonReadEvalPrint(['first', ['quote', ['a']]]).toMatchInlineSnapshot(`"a"`);
  });

  test('invalid first', () => {
    expectJsonReadEvalError(['first', ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: first: expected argument to be list but got a"`
    );
    expectJsonReadEvalError(['first', 1]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: first: expected argument to be list but got 1"`
    );
    expectJsonReadEvalError(['first', true]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: first: expected argument to be list but got #t"`
    );
    expectJsonReadEvalError(['first', ['quote', []]]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: first: expected argument to be list but got ()"`
    );
    expectJsonReadEvalError(['first']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: first: expected exactly 1 argument but got "`
    );
    expectJsonReadEvalError(['first', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: first: expected exactly 1 argument but got a, a"`
    );
  });

  test('valid rest', () => {
    expectJsonReadEvalPrint(['rest', ['quote', ['a']]]).toMatchInlineSnapshot(`Array []`);
    expectJsonReadEvalPrint(['rest', ['quote', ['a', 'b']]]).toMatchInlineSnapshot(`
      Array [
        "b",
      ]
    `);
  });

  test('invalid rest', () => {
    expectJsonReadEvalError(['rest', ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: rest: expected argument to be list but got a"`
    );
    expectJsonReadEvalError(['rest', 1]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: rest: expected argument to be list but got 1"`
    );
    expectJsonReadEvalError(['rest', true]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: rest: expected argument to be list but got #t"`
    );
    expectJsonReadEvalError(['rest', ['quote', []]]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: rest: expected argument to be list but got ()"`
    );
    expectJsonReadEvalError(['rest']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: rest: expected exactly 1 argument but got "`
    );
    expectJsonReadEvalError(['rest', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: rest: expected exactly 1 argument but got a, a"`
    );
  });

  test('valid last', () => {
    expectJsonReadEvalPrint(['last', ['quote', ['a']]]).toMatchInlineSnapshot(`"a"`);
    expectJsonReadEvalPrint(['last', ['quote', ['a', 'b']]]).toMatchInlineSnapshot(`"b"`);
  });

  test('invalid last', () => {
    expectJsonReadEvalError(['last', ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last: expected argument to be list but got a"`
    );
    expectJsonReadEvalError(['last', 1]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last: expected argument to be list but got 1"`
    );
    expectJsonReadEvalError(['last', true]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last: expected argument to be list but got #t"`
    );
    expectJsonReadEvalError(['last', ['quote', []]]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last: expected argument to be list but got ()"`
    );
    expectJsonReadEvalError(['last']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last: expected exactly 1 argument but got "`
    );
    expectJsonReadEvalError(['last', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last: expected exactly 1 argument but got a, a"`
    );
  });

  test('valid last-pair', () => {
    expectJsonReadEvalPrint(['last-pair', ['quote', ['a', 'b']]]).toMatchInlineSnapshot(`
      Array [
        "b",
      ]
    `);
    expectJsonReadEvalPrint(['last-pair', ['quote', ['a', '.', 'b']]]).toMatchInlineSnapshot(`
      Array [
        "a",
        ".",
        "b",
      ]
    `);
  });

  test('invalid last-pair', () => {
    expectJsonReadEvalError(['last-pair', ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last_pair: expected argument to be list but got a"`
    );
    expectJsonReadEvalError(['last-pair', 1]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last_pair: expected argument to be list but got 1"`
    );
    expectJsonReadEvalError(['last-pair', true]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last_pair: expected argument to be list but got #t"`
    );
    expectJsonReadEvalError(['last-pair', ['quote', []]]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last_pair: expected argument to be list but got ()"`
    );
    expectJsonReadEvalError(['last-pair']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last_pair: expected exactly 1 argument but got "`
    );
    expectJsonReadEvalError(['last-pair', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: last_pair: expected exactly 1 argument but got a, a"`
    );
  });
});

describe('valueEqualityOps', () => {
  test('valid eq?', () => {
    expectJsonReadEvalPrint(['eq?', 1, 1]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['eq?', 1, 1, 1]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['eq?', 0, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['eq?', 0, 1, 0]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['eq?', 0, 1, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['eq?', ['quote', 'a'], ['quote', 'b']]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['eq?', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['eq?', true, true]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['eq?', true, false]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['eq?', ['list'], ['list']]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint([
      'eq?',
      ['list', ['quote', 'b'], ['quote', 'c']],
      ['list', ['quote', 'b'], ['quote', 'c']],
    ]).toMatchInlineSnapshot(`false`);
  });

  test('valid symbol=?', () => {
    expectJsonReadEvalPrint(['symbol=?', 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['symbol=?', 'symbol=?']).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['symbol=?', 'number=?']).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['symbol=?', ['quote', 'a']]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['symbol=?', ['quote', 'a'], ['quote', 'a']]).toMatchInlineSnapshot(
      `true`
    );
    expectJsonReadEvalPrint(['symbol=?', ['quote', 'a'], ['quote', 'b']]).toMatchInlineSnapshot(
      `false`
    );
  });

  test('invalid symbol=?', () => {
    expectJsonReadEvalError(['symbol=?', 'iamsymbol']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: evaluate (#%variable-reference): could not find variable iamsymbol"`
    );
    expectJsonReadEvalError(['symbol=?', 'a', 'a']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: evaluate (#%variable-reference): could not find variable a"`
    );
    expectJsonReadEvalError(['symbol=?', 'z']).toMatchInlineSnapshot(
      `"error when evaluating precompiled fep: evaluate (#%variable-reference): could not find variable z"`
    );
  });

  test('valid number=?', () => {
    expectJsonReadEvalPrint(['number=?', 1, 1]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['number=?', 0, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['number=?', 0, 1, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['number=?', 0, ['quote', 'a']]).toMatchInlineSnapshot(`false`);
  });

  test('valid boolean=?', () => {
    expectJsonReadEvalPrint(['boolean=?', 1, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['boolean=?', false, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['boolean=?', false]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['boolean=?', false, true]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['boolean=?', true, true]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['boolean=?']).toMatchInlineSnapshot(`true`);
  });
});

describe('listEqualityOps', () => {
  test('valid equal?', () => {
    expectJsonReadEvalPrint(['equal?', 1, 1]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['equal?', 1, 1, 1]).toMatchInlineSnapshot(`true`);
    expectJsonReadEvalPrint(['equal?', 0, 1]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['equal?', 0, 1, 0]).toMatchInlineSnapshot(`false`);
    expectJsonReadEvalPrint(['equal?', 0, 1, 1]).toMatchInlineSnapshot(`false`);
  });
});
