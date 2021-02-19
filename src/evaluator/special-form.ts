import { MatchObject, json_plus, json_star, json_var, match, Pattern } from '../pattern';
import { SList } from '../sexpr';
import { val, car } from '../sexpr';
import { is_symbol } from '../sexpr';
import { jsonRead } from '../sexpr';

export type SpecialForms = 'let' | 'quote';

export interface Form {
  pattern: Pattern;
  form: SpecialForms;
}

export const special_forms: Record<string, Form[]> = {
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
  | { match_type: MatchType.Match; form: SpecialForms; matches: MatchObject }
  | { match_type: MatchType.InvalidSyntax; form: undefined; matches: undefined }
  | { match_type: MatchType.NoMatch; form: undefined; matches: undefined };

export function match_special_form(program: SList<never>): MatchResult {
  const head = car(program);
  if (!is_symbol(head)) {
    return { match_type: MatchType.NoMatch, form: undefined, matches: undefined };
  }
  const keyword = val(head);

  const forms = special_forms[keyword];

  if (forms === undefined) {
    return { match_type: MatchType.NoMatch, form: undefined, matches: undefined };
  }

  for (const form of forms) {
    const matches: MatchObject | undefined = match(program, form.pattern);
    if (matches !== undefined) {
      return { match_type: MatchType.Match, form: form.form, matches };
    }
  }

  return { match_type: MatchType.InvalidSyntax, form: undefined, matches: undefined };
}
