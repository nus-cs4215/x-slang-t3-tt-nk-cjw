import { read } from '../reader';

describe('valid read tests', () => {
  test('basic parens', () => {
    expect(read('()')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SNil",
        },
      }
    `
    );
    expect(read('[]')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SNil",
        },
      }
    `
    );
    expect(read('{}')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SNil",
        },
      }
    `
    );
  });
  test('basic atoms', () => {
    expect(read('abc')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SAtom",
          "val": "abc",
        },
      }
    `
    );
    expect(read('abc->def')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SAtom",
          "val": "abc->def",
        },
      }
    `
    );
  });
  test('basic numbers', () => {
    expect(read('123')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SNumber",
          "val": 123,
        },
      }
    `
    );
    expect(read('123.5')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SNumber",
          "val": 123.5,
        },
      }
    `
    );
  });
  test('basic booleans', () => {
    expect(read('#t')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SBoolean",
          "val": true,
        },
      }
    `
    );
    expect(read('#f')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SBoolean",
          "val": false,
        },
      }
    `
    );
  });
  test('basic lists', () => {
    expect(read('(abc 123 #t)')).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SList",
          "elems": Array [
            Object {
              "_type": "SAtom",
              "val": "abc",
            },
            Object {
              "_type": "SNumber",
              "val": 123,
            },
            Object {
              "_type": "SBoolean",
              "val": true,
            },
          ],
          "tail": Object {
            "_type": "SNil",
          },
        },
      }
    `
    );
  });
  test('basic quotes', () => {
    expect(read("'(abc 123 #t)")).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SList",
          "elems": Array [
            Object {
              "_type": "SAtom",
              "val": "quote",
            },
            Object {
              "_type": "SList",
              "elems": Array [
                Object {
                  "_type": "SAtom",
                  "val": "abc",
                },
                Object {
                  "_type": "SNumber",
                  "val": 123,
                },
                Object {
                  "_type": "SBoolean",
                  "val": true,
                },
              ],
              "tail": Object {
                "_type": "SNil",
              },
            },
          ],
          "tail": Object {
            "_type": "SNil",
          },
        },
      }
    `
    );
    expect(read("('abc 123 #t)")).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SList",
          "elems": Array [
            Object {
              "_type": "SList",
              "elems": Array [
                Object {
                  "_type": "SAtom",
                  "val": "quote",
                },
                Object {
                  "_type": "SAtom",
                  "val": "abc",
                },
              ],
              "tail": Object {
                "_type": "SNil",
              },
            },
            Object {
              "_type": "SNumber",
              "val": 123,
            },
            Object {
              "_type": "SBoolean",
              "val": true,
            },
          ],
          "tail": Object {
            "_type": "SNil",
          },
        },
      }
    `
    );
    expect(read("'('abc 123 #t)")).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SList",
          "elems": Array [
            Object {
              "_type": "SAtom",
              "val": "quote",
            },
            Object {
              "_type": "SList",
              "elems": Array [
                Object {
                  "_type": "SList",
                  "elems": Array [
                    Object {
                      "_type": "SAtom",
                      "val": "quote",
                    },
                    Object {
                      "_type": "SAtom",
                      "val": "abc",
                    },
                  ],
                  "tail": Object {
                    "_type": "SNil",
                  },
                },
                Object {
                  "_type": "SNumber",
                  "val": 123,
                },
                Object {
                  "_type": "SBoolean",
                  "val": true,
                },
              ],
              "tail": Object {
                "_type": "SNil",
              },
            },
          ],
          "tail": Object {
            "_type": "SNil",
          },
        },
      }
    `
    );
    expect(read("''('abc 123 #t)")).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SList",
          "elems": Array [
            Object {
              "_type": "SAtom",
              "val": "quote",
            },
            Object {
              "_type": "SList",
              "elems": Array [
                Object {
                  "_type": "SAtom",
                  "val": "quote",
                },
                Object {
                  "_type": "SList",
                  "elems": Array [
                    Object {
                      "_type": "SList",
                      "elems": Array [
                        Object {
                          "_type": "SAtom",
                          "val": "quote",
                        },
                        Object {
                          "_type": "SAtom",
                          "val": "abc",
                        },
                      ],
                      "tail": Object {
                        "_type": "SNil",
                      },
                    },
                    Object {
                      "_type": "SNumber",
                      "val": 123,
                    },
                    Object {
                      "_type": "SBoolean",
                      "val": true,
                    },
                  ],
                  "tail": Object {
                    "_type": "SNil",
                  },
                },
              ],
              "tail": Object {
                "_type": "SNil",
              },
            },
          ],
          "tail": Object {
            "_type": "SNil",
          },
        },
      }
    `
    );
    expect(read("('abc 123 '#t)")).toMatchSnapshot(
      { good: true },
      `
      Object {
        "err": undefined,
        "good": true,
        "v": Object {
          "_type": "SList",
          "elems": Array [
            Object {
              "_type": "SList",
              "elems": Array [
                Object {
                  "_type": "SAtom",
                  "val": "quote",
                },
                Object {
                  "_type": "SAtom",
                  "val": "abc",
                },
              ],
              "tail": Object {
                "_type": "SNil",
              },
            },
            Object {
              "_type": "SNumber",
              "val": 123,
            },
            Object {
              "_type": "SList",
              "elems": Array [
                Object {
                  "_type": "SAtom",
                  "val": "quote",
                },
                Object {
                  "_type": "SBoolean",
                  "val": true,
                },
              ],
              "tail": Object {
                "_type": "SNil",
              },
            },
          ],
          "tail": Object {
            "_type": "SNil",
          },
        },
      }
    `
    );
  });
});

describe('invalid read tests', () => {
  test('bad parens', () => {
    expect(read('(')).toMatchInlineSnapshot(
      { good: false },
      `
      Object {
        "err": Object {
          "message": "Unexpected EOF",
        },
        "good": false,
        "v": undefined,
      }
    `
    );
    expect(read(')')).toMatchInlineSnapshot(
      { good: false },
      `
      Object {
        "err": Object {
          "message": "Unexpected parenthesis",
        },
        "good": false,
        "v": undefined,
      }
    `
    );
    expect(read('(]')).toMatchInlineSnapshot(
      { good: false },
      `
      Object {
        "err": Object {
          "message": "Mismatched parentheses",
        },
        "good": false,
        "v": undefined,
      }
    `
    );
  });
  test('bad atoms', () => {
    expect(read('.')).toMatchInlineSnapshot(
      { good: false },
      `
      Object {
        "err": Object {
          "message": "Lone dot not allowed at top level",
        },
        "good": false,
        "v": undefined,
      }
    `
    );
  });
  test('bad delims', () => {
    expect(read("'")).toMatchInlineSnapshot(
      { good: false },
      `
      Object {
        "err": Object {
          "message": "Unexpected EOF",
        },
        "good": false,
        "v": undefined,
      }
    `
    );
  });
});
