import { Result } from '../utils';
import { SExprT, SCons, SSymbol, SNil, SHomList, SNonemptyHomList, SExpr } from '../sexpr';
import { Environment } from './environment';
import { EvalData } from './datatypes';

export type EvalSExpr = SExprT<EvalData>;

export type EvalResult = Result<EvalSExpr, void>;

export type Apply = (fun: EvalSExpr, ...args: EvalSExpr[]) => EvalResult;

export type Evaluate = (program: EvalSExpr, env: Environment) => EvalResult;

export type CompileError = {};
export type CompileResult = Result<TopLevelForm, CompileError>;
export type Compile = (program: SExpr, env: Environment) => CompileResult;

export type EvaluateTopLevel = (program: TopLevelForm, env: Environment) => EvalResult;

export type Token<V> = SSymbol & { val: V };

export type TopLevelForm =
  | GeneralTopLevelForm
  | SCons<Token<'#%expression'>, FEExpr>
  | SCons<
      Token<'module'>,
      SCons<
        SSymbol,
        SCons<SSymbol, SCons<SCons<Token<'#%plain-module-begin'>, SHomList<ModuleLevelForm>>, SNil>>
      >
    >
  | SCons<Token<'begin'>, SNonemptyHomList<TopLevelForm>>
  | SCons<Token<'begin-for-syntax'>, SNonemptyHomList<TopLevelForm>>;

export type ModuleLevelForm =
  | GeneralTopLevelForm
  | SCons<Token<'#%provide'>, SHomList<SSymbol>>
  | SCons<Token<'begin-for-syntax'>, SNonemptyHomList<ModuleLevelForm>>
  | SubmoduleForm
  | SCons<Token<'#%declare'>, SHomList<SSymbol>>;

export type SubmoduleForm = SCons<
  Token<'module'>,
  SCons<
    SSymbol,
    SCons<SSymbol, SCons<SCons<Token<'#%plain-module-begin'>, SHomList<ModuleLevelForm>>, SNil>>
  >
>;

export type GeneralTopLevelForm =
  | FEExpr
  | SCons<Token<'define'>, SCons<SHomList<SSymbol>, SCons<FEExpr, SNil>>>
  | SCons<Token<'define-syntax'>, SCons<SHomList<SSymbol>, SCons<FEExpr, SNil>>>
  | SCons<Token<'require'>, SCons<SSymbol, SNil>>;

export type FEExpr =
  | SSymbol
  | SCons<Token<'#%plain-lambda'>, SCons<FEFormals, SNonemptyHomList<FEExpr>>>
  // | SCons<Token<'case-lambda'>, SHomList<SCons<FEFormals, SNonemptyHomList<FEExpr>>>>
  | SCons<Token<'if'>, SCons<FEExpr, SCons<FEExpr, SCons<FEExpr, SNil>>>>
  | SCons<Token<'begin'>, SNonemptyHomList<FEExpr>>
  | SCons<Token<'begin0'>, SNonemptyHomList<FEExpr>>
  // | SCons<Token<'let-values'>, SNonemptyHomList<FEExpr>>
  | SCons<
      Token<'let'>,
      SCons<SHomList<SCons<SHomList<SSymbol>, SCons<FEExpr, SNil>>>, SNonemptyHomList<FEExpr>>
    >
  | SCons<
      Token<'letrec'>,
      SCons<SHomList<SCons<SHomList<SSymbol>, SCons<FEExpr, SNil>>>, SNonemptyHomList<FEExpr>>
    >
  // | SCons<Token<'set!'>, SCons<SSymbol, SCons<FEExpr, SNil>>>
  | SCons<Token<'quote'>, SCons<SExpr, SNil>>
  // | SCons<Token<'quote-syntax'>, SCons<SExpr, SNil>>
  | SCons<Token<'#%plain-app'>, SNonemptyHomList<FEExpr>>
  | SCons<Token<'#%top'>, SSymbol>
  | SCons<Token<'#%variable-reference'>, SCons<SSymbol, SNil>>
  | SCons<Token<'#%variable-reference'>, SCons<SCons<Token<'#%top'>, SSymbol>, SNil>>
  | SCons<Token<'#%variable-reference'>, SNil>;

export type FEFormals = SSymbol | SNil | SCons<SSymbol, FEFormals>;
