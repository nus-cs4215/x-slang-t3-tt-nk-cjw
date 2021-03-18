import { SCons, SExpr, SHomList, SNil, SNonemptyHomList, SSymbol } from './sexpr';

// For now, let them be equal
export type TopLevelModuleFormAst = TopLevelModuleForm;
export type ModuleLevelFormAst = ModuleLevelForm;
export type GeneralTopLevelFormAst = GeneralTopLevelForm;

export type Token<V> = SSymbol & { val: V };

// These are subtypes of SExpr, and is the type of compile's output.
// This is so we can be sure that what compile outputs is always serializable by the writer into valid FEP.
export type TopLevelForm =
  | GeneralTopLevelForm
  | ExplicitExpressionForm
  | ModuleFileParentForm
  | ModuleBuiltinParentForm;
export type TopLevelModuleForm = ModuleFileParentForm | ModuleBuiltinParentForm;
export type ExplicitExpressionForm = SCons<Token<'#%expression'>, FEExpr>;
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

export type PlainModuleBeginForm = SCons<Token<'#%plain-module-begin'>, SHomList<ModuleLevelForm>>;

export type ModuleLevelForm =
  | GeneralTopLevelForm
  | ProvideForm
  | RequireFileForm
  | RequireBuiltinForm
  | BeginForSyntaxForm
  | ModuleFileParentForm
  | ModuleBuiltinParentForm;

export type ProvideForm = SCons<Token<'#%provide'>, SHomList<SSymbol>>;
export type BeginForSyntaxForm = SCons<
  Token<'begin-for-syntax'>,
  SNonemptyHomList<ModuleLevelForm>
>;

export type GeneralTopLevelForm = FEExpr | DefineForm | DefineSyntaxForm;

export type DefineForm = SCons<Token<'define'>, SCons<SSymbol, SCons<FEExpr, SNil>>>;
export type DefineSyntaxForm = SCons<Token<'define-syntax'>, SCons<SSymbol, SCons<FEExpr, SNil>>>;
export type RequireFileForm = SCons<Token<'#%require'>, SCons<SSymbol, SNil>>;
export type RequireBuiltinForm = SCons<
  Token<'#%require'>,
  SCons<SCons<Token<'quote'>, SCons<SSymbol, SNil>>, SNil>
>;

export type FEExpr =
  | PlainLambdaForm
  | IfForm
  | BeginForm
  | Begin0Form
  | LetForm
  | LetrecForm
  | QuoteForm
  | PlainAppForm
  | VariableReferenceForm;

export type PlainLambdaForm = SCons<
  Token<'#%plain-lambda'>,
  SCons<FEFormals, SNonemptyHomList<FEExpr>>
>;
export type IfForm = SCons<Token<'if'>, SCons<FEExpr, SCons<FEExpr, SCons<FEExpr, SNil>>>>;
export type BeginForm = SCons<Token<'begin'>, SNonemptyHomList<FEExpr>>;
export type Begin0Form = SCons<Token<'begin0'>, SNonemptyHomList<FEExpr>>;
export type LetForm = SCons<
  Token<'let'>,
  SCons<SHomList<SCons<SSymbol, SCons<FEExpr, SNil>>>, SNonemptyHomList<FEExpr>>
>;
export type LetrecForm = SCons<
  Token<'letrec'>,
  SCons<SHomList<SCons<SSymbol, SCons<FEExpr, SNil>>>, SNonemptyHomList<FEExpr>>
>;
export type QuoteForm = SCons<Token<'quote'>, SCons<SExpr, SNil>>;
export type PlainAppForm = SCons<Token<'#%plain-app'>, SNonemptyHomList<FEExpr>>;
export type VariableReferenceForm = SCons<Token<'#%variable-reference'>, SCons<SSymbol, SNil>>;

export type FEFormals = SSymbol | SNil | SCons<SSymbol, FEFormals>;
