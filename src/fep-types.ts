import { SCons, SExpr, SHomList, SNil, SNonemptyHomList, SSymbol } from './sexpr';

// contains every possible FEP type
export type FEPNode =
  | ModuleForm
  | PlainModuleBeginForm
  | StatementForm
  | ExprOrDefineForm
  | ExprForm;

// For now, let them be equal
export type ModuleAst = ModuleForm;
export type StatementAst = StatementForm;
export type ExprOrDefineAst = ExprOrDefineForm;

export type Token<V> = SSymbol & { val: V };

// These are subtypes of SExpr, and is the type of compile's output (A Fully Expanded Program, FEP)
// This is so we can be sure that what compile outputs is always serializable by the writer into valid FEP.
export type ModuleForm = ModuleFileParentForm | ModuleBuiltinParentForm;
export type ModuleFileParentForm = SCons<
  Token<'module'>,
  SCons<SSymbol, SCons<SSymbol, SCons<PlainModuleBeginForm, SNil>>>
>;
export type ModuleBuiltinParentForm = SCons<
  Token<'module'>,
  SCons<
    SSymbol,
    SCons<SCons<Token<'quote'>, SCons<SSymbol, SNil>>, SCons<PlainModuleBeginForm, SNil>>
  >
>;

export type PlainModuleBeginForm = SCons<Token<'#%plain-module-begin'>, SHomList<StatementForm>>;

export type StatementForm = ExprOrDefineForm | ProvideForm | RequireForm | BeginForSyntaxForm;

export type ProvideForm = SCons<Token<'#%provide'>, SHomList<SExpr>>;
export type BeginForSyntaxForm = SCons<Token<'begin-for-syntax'>, SNonemptyHomList<StatementForm>>;

export type ExprOrDefineForm = ExprForm | DefineForm | DefineSyntaxForm;

export type DefineForm = SCons<Token<'define'>, SCons<SSymbol, SCons<ExprForm, SNil>>>;
export type DefineSyntaxForm = SCons<Token<'define-syntax'>, SCons<SSymbol, SCons<ExprForm, SNil>>>;
export type RequireForm = SCons<Token<'#%require'>, SHomList<SExpr>>;

// program:
//  - function table,
//      where the 1st function (function 0) is the one executed when the program starts)
//      func id -> func body (an instruction array)
//  - name translation table:
//      name id -> name (string)
//      name -> name id (at compile time, we need this)
//  - constant table:
//      const id -> value (sexpr)
//  - require table
//      list of require specs (see other stuff for how to read this)
//  - provide table
//      list of provide specs (see other stuff for how to read this)

// runtime state:
//  - OS (operand stack)
//  - ENV (environment, see src/environment/environment.ts)
//  - FUNC ID (see function table above)
//  - PC (program counter, index inside the body of the currently executing function)
//  - RTS (runtime stack, used when we reach the end of a function body, we pop the RTS)
//    - stack of (OS, ENV, FUNC ID, PC)

// type DefineForm = SCons<Token<'define'>, SCons<SSymbol, SCons<ExprForm, SNil>>>;
// <expr>,
// add_binding <name>
// type DefineSyntaxForm = SCons<Token<'define-syntax'>, SCons<SSymbol, SCons<ExprForm, SNil>>>;
// <expr>,
// add_syntax_binding <name>

export type ExprForm =
  | IfForm
  // <cond_expr>,
  // jump_if_false (absolute position of alt_expr),
  // <then_expr>,
  // jump (absolute position after alt_expr),
  // <alt_expr>
  | BeginForm // <expr1>,<expr2>,...popN <n-1>,<exprn>
  | Begin0Form // <expr1>,<expr2>,...,<exprn>,popN <n-1>
  | PlainLambdaForm // expression: make_func <func id> // get_func
  // when compiling this, add new function to function table, <body>
  | LetForm
  // <expr1>,
  // ...,
  // <exprn>,
  // extend_env,
  // add_binding <namen id>,
  // add_binding <name(n-1) id>,
  // ...,
  // add_binding <name1 id>
  | LetrecForm
  // extend_env,
  // add_binding_undefined <name1 id>
  // add_binding_undefined <name2 id>,
  // ...,
  // add_binding_undefined <namen id>
  // <expr1>,
  // set_env <name1 id>,
  // <expr2>,
  // set_env <name2 id>,
  // ...,
  // <exprn>,
  // set_env <namen id>,
  | QuoteForm // make_const <const id>                          // get_const
  | PlainAppForm // <func_expr>,<arg1_expr>,...<argn_expr>,call n // extend_env, push_rts
  | VariableReferenceForm // get_env <name id>                  // get_env
  | SetForm; // set_env <name id>                               // set_env

export type PlainLambdaForm = SCons<
  Token<'#%plain-lambda'>,
  SCons<FEFormals, SNonemptyHomList<ExprForm>>
>;
export type IfForm = SCons<Token<'if'>, SCons<ExprForm, SCons<ExprForm, SCons<ExprForm, SNil>>>>;
export type BeginForm = SCons<Token<'begin'>, SNonemptyHomList<ExprForm>>;
export type Begin0Form = SCons<Token<'begin0'>, SNonemptyHomList<ExprForm>>;
export type LetForm = SCons<
  Token<'let'>,
  SCons<SHomList<SCons<SSymbol, SCons<ExprForm, SNil>>>, SNonemptyHomList<ExprForm>>
>;
export type LetrecForm = SCons<
  Token<'letrec'>,
  SCons<SHomList<SCons<SSymbol, SCons<ExprForm, SNil>>>, SNonemptyHomList<ExprForm>>
>;
export type QuoteForm = SCons<Token<'quote'>, SCons<SExpr, SNil>>;
export type PlainAppForm = SCons<Token<'#%plain-app'>, SNonemptyHomList<ExprForm>>;
export type VariableReferenceForm = SCons<Token<'#%variable-reference'>, SCons<SSymbol, SNil>>;
export type SetForm = SCons<Token<'set!'>, SCons<SSymbol, SCons<ExprForm, SNil>>>;

export type FEFormals = SSymbol | SNil | SCons<SSymbol, FEFormals>;
