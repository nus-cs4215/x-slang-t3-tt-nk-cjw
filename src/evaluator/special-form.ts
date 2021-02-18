import { MatchObject, json_plus, json_star, json_var, match, Pattern } from '../pattern';
import { SList } from '../sexpr';
import { val, car } from '../sexpr';
import { is_symbol } from '../sexpr';
import { jsonRead } from '../sexpr';
import { hasKey } from '../utils';

export type SpecialFormKeywordToType = {
  cond: 'cond';
  lambda: 'lambda';
  let: 'let';
  quote: 'quote';
};

export type SpecialFormKeywords = keyof SpecialFormKeywordToType;

export type SpecialFormType = SpecialFormKeywordToType[SpecialFormKeywords];

export interface Form {
  pattern: Pattern;
  form: SpecialFormType;
}

export const special_forms: Record<SpecialFormKeywords, Form[]> = {
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
  quote: [
    {
      pattern: jsonRead(['quote', json_var('e')]),
      form: 'quote',
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

export function match_special_form(program: SList<never>): MatchResult {
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
