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

export type ExprForm =
  | PlainLambdaForm
  | IfForm
  | BeginForm
  | Begin0Form
  | LetForm
  | LetrecForm
  | QuoteForm
  | PlainAppForm
  | VariableReferenceForm
  | SetForm;

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
