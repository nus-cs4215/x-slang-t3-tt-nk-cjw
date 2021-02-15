export type SAtom = string;
export type SNil = [];
export type SExpr = SAtom | [SExpr[], SExpr] | SNil;
