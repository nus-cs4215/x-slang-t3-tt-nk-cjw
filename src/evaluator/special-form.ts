import { MatchObject, json_plus, json_star, json_var, match, Pattern } from '../pattern';
import { SList } from '../sexpr';
import { val, car } from '../sexpr';
import { is_symbol } from '../sexpr';
import { jsonRead } from '../sexpr';
import { hasKey } from '../utils';
import { EvalData } from './datatypes';

type SpecialFormKeywordToType = {
  define: 'define_const' | 'define_func';
  begin: 'begin';
  begin0: 'begin0';
  cond: 'cond';
  and: 'and';
  or: 'or';
  lambda: 'lambda';
  let: 'let';
  'let*': 'let*';
  letrec: 'letrec';
  quote: 'quote';
  quasiquote: 'quasiquote';
  unquote: 'unquote';
};

export type SpecialFormKeywords = keyof SpecialFormKeywordToType;

export type SpecialFormType = SpecialFormKeywordToType[SpecialFormKeywords];

export type SpecialForms = SpecialFormKeywords;

export interface Form {
  pattern: Pattern;
  form: SpecialFormType;
}

export const special_forms: Record<SpecialFormKeywords, Form[]> = {
  define: [
    {
      pattern: jsonRead([
        'define',
        [json_var('fun_name'), '.', json_star(json_var('params'), [])],
        '.',
        json_plus(json_var('body'), []),
      ]),
      form: 'define_func',
    },
    {
      pattern: jsonRead(['define', json_var('id'), json_var('expr')]),
      form: 'define_const',
    },
  ],
  begin: [
    {
      pattern: jsonRead(['begin', '.', json_plus(json_var('body'), [])]),
      form: 'begin',
    },
  ],
  begin0: [
    {
      pattern: jsonRead(['begin0', '.', json_plus(json_var('body'), [])]),
      form: 'begin0',
    },
  ],
  cond: [
    {
      pattern: jsonRead([
        'cond',
        '.',
        json_plus([json_var('test_exprs'), '.', json_var('then_bodies')], []),
      ]),
      form: 'cond',
    },
  ],
  and: [
    {
      pattern: jsonRead([
        'and',
        '.',
        json_star(json_var('exprs'), []),
      ]),
      form: 'and',
    },
  ],
  or: [
    {
      pattern: jsonRead([
        'or',
        '.',
        json_star(json_var('exprs'), []),
      ]),
      form: 'or',
    },
  ],
  lambda: [
    {
      pattern: jsonRead([
        'lambda',
        json_star(json_var('params'), []),
        '.',
        json_plus(json_var('body'), []),
      ]),
      form: 'lambda',
    },
  ],
  let: [
    {
      pattern: jsonRead([
        'let',
        json_star([json_var('ids'), json_var('val_exprs')], []),
        '.',
        json_plus(json_var('bodies'), []),
      ]),
      form: 'let',
    },
  ],
  'let*': [
    {
      pattern: jsonRead([
        'let*',
        json_star([json_var('ids'), json_var('val_exprs')], []),
        '.',
        json_plus(json_var('bodies'), []),
      ]),
      form: 'let*',
    },
  ],
  letrec: [
    {
      pattern: jsonRead([
        'letrec',
        json_star([json_var('ids'), json_var('val_exprs')], []),
        '.',
        json_plus(json_var('bodies'), []),
      ]),
      form: 'letrec',
    },
  ],
  quote: [
    {
      pattern: jsonRead(['quote', json_var('e')]),
      form: 'quote',
    },
  ],
  quasiquote: [
    {
      pattern: jsonRead(['quasiquote', json_var('e')]),
      form: 'quasiquote',
    },
  ],
  unquote: [
    {
      pattern: jsonRead(['unquote', json_var('e')]),
      form: 'unquote',
    },
  ],
};

export enum MatchType {
  Match,
  InvalidSyntax,
  NoMatch,
}

export type MatchResult =
  | { match_type: MatchType.Match; form: SpecialFormType; matches: MatchObject }
  | { match_type: MatchType.InvalidSyntax; form: undefined; matches: undefined }
  | { match_type: MatchType.NoMatch; form: undefined; matches: undefined };

export function match_special_form(program: SList<EvalData>): MatchResult {
  const head = car(program);
  if (!is_symbol(head)) {
    return { match_type: MatchType.NoMatch, form: undefined, matches: undefined };
  }
  const keyword = val(head);

  if (hasKey(special_forms, keyword)) {
    for (const form of special_forms[keyword]) {
      const matches: MatchObject | undefined = match(program, form.pattern);
      if (matches !== undefined) {
        return { match_type: MatchType.Match, form: form.form, matches };
      }
    }
  } else {
    return { match_type: MatchType.NoMatch, form: undefined, matches: undefined };
  }

  return { match_type: MatchType.InvalidSyntax, form: undefined, matches: undefined };
}
