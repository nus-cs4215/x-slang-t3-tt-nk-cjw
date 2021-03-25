import { STypes, SExprT, val, car, cdr, is_list, is_nil } from '../sexpr';

type StringExpr = [StringExpr[], number] | [string, number];

function print_to_stringexpr<T>(
  e: SExprT<T>,
  cache: Map<SExprT<T>, StringExpr> = new Map()
): StringExpr {
  // Output is the "string expr" followed by its length in characters
  // This tree follows the structure of the S-expression,
  // which allows for indentation with indent_stringexpr.
  if (cache.has(e)) {
    return cache.get(e)!;
  }

  // Recursive SExpr handling as easy as 123
  cache.set(e, ['#...recursive', 13]);

  let result: StringExpr;
  switch (e._type) {
    case STypes.Nil:
      result = [[], 0];
      break;
    case STypes.Symbol:
      result = [val(e), val(e).length];
      break;
    case STypes.Number:
      if (Number.isNaN(val(e))) {
        result = ['+nan.0', 6];
      } else if (val(e) === Infinity) {
        result = ['+inf.0', 6];
      } else if (val(e) === -Infinity) {
        result = ['-inf.0', 6];
      } else {
        const s = val(e).toString();
        result = [s, s.length];
      }
      break;
    case STypes.Boolean:
      result = [val(e) ? '#t' : '#f', 2];
      break;
    case STypes.List: {
      const output: StringExpr[] = [];
      let length = 1;

      // handle first element
      const first = print_to_stringexpr(car(e), cache);
      output.push(first);
      length += first[1];

      // handle the rest of the elements
      for (e = cdr(e); is_list(e); e = cdr(e)) {
        const sub = print_to_stringexpr(car(e), cache);
        output.push(sub);
        length += sub[1];
      }

      // handle improper list
      if (!is_nil(e)) {
        const last = print_to_stringexpr(e, cache);
        output.push(['.', 1]);
        length += 1;
        output.push(last);
        length += last[1];
      }

      result = [output, length];
      break;
    }
    case STypes.Boxed:
      result = ['#boxed', 6];
      break;
  }

  cache.set(e, result);
  return result;
}

function flatten_expr_to_tree(expr: StringExpr, flat: string[] = []): StringTree[] {
  // While there can be shared trees, we're guaranteed that the string tree is a DAG.
  // If it wasn't, it's unclear what this function should do, anyway.
  //
  // This also needs to do the job of adding spaces and brackets
  // (tree corresponds to formatted string, not s-expr structure)

  if (Array.isArray(expr[0])) {
    if (expr[0].length === 0) {
      flat.push('()');
    } else {
      flat.push('(');
      for (const child of expr[0]) {
        flatten_expr_to_tree(child, flat);
        flat.push(' ');
      }
      flat.pop(); // so sue me
      flat.push(')');
    }
  } else {
    flat.push(expr[0]);
  }

  return flat;
}

type StringTree = StringTree[] | string;

// A map from special keywords to how many items we want to keep on the same line as the keyword itself.
// e.g. module maps to 2 because we want to keep its name and its module path.
// (module name path
//   rest of code...
//   )
const keep_on_same_line: Map<string, number> = new Map([
  ['module', 2],
  ['lambda', 1],
  ['#%plain-lambda', 1],
  ['if', 1],
  ['let', 1],
  ['letrec', 1],
  ['define', 1],
  ['define-syntax', 1],
]);

function format_stringexpr(
  expr: StringExpr,
  lineLength: number = 60,
  cache: Map<StringExpr, [number, StringTree][]> = new Map()
): [number, StringTree][] {
  // Output is a list of string exprs and their indentation levels, each one taking up 1 line.
  // This is so that we can indenting subexprs easily by looping over the results given by the recursive call.
  // We do NOT follow the S-expression structure anymore

  // Algorithm:
  // We will indent from the outside in.
  // First we look at the expr's size.
  // if it's too big, we'll indent each one individually recursively,
  // getting a bunch of string trees.
  // string trees, unlike string exprs,
  // directly correspond to the final formatted output,
  // not the sexpr structure,
  // and no longer need to store the size info anymore.
  // Finally we prepend the indent string to each resulting tree.
  //
  // If it's not too big, then it fits on a single line.
  // So we insert spaces then and add a newline appended at the end.

  // Note that we cannot mutate any trees in place because there ___CAN BE SHARED TREES___!

  // Finally, we do caching for performance sake.
  // Note that we don't bother handling the recursive case.
  // that should not happen, because these exprs are DAGs
  // (they come from our print to stringexpr function, which already resolves cycles)

  if (cache.has(expr)) {
    return cache.get(expr)!;
  }

  const result: [number, StringTree][] = [];
  if (Array.isArray(expr[0])) {
    if (expr[1] > lineLength) {
      // too big case
      const indented_children: [number, StringTree][][] = [];
      for (const child of expr[0]) {
        indented_children.push(format_stringexpr(child, lineLength));
      }
      // If there were no children, we do the () and we are done
      if (indented_children.length === 0) {
        result.push([0, '()']);
      } else {
        // Figure out if we should keep stuff on the same line
        let num_on_first_line = 1;
        if (indented_children[0].length > 1) {
          // If the first guy is already multiline, give up and put everything on different lines
        } else {
          // The first guy is on a single line, so we can try
          if (keep_on_same_line.has(indented_children[0][0][1] as string)) {
            num_on_first_line += keep_on_same_line.get(indented_children[0][0][1] as string)!;
          }
        }
        // Make first line
        const first_line: StringTree[] = ['('];
        for (const first of indented_children[0]) {
          first_line.push(first[1]);
          first_line.push(' ');
        }
        // if all the stuff that were meant to go on the same line all printed to single line stuff, do that
        let should_same_line = true;
        for (let i = 1; i < num_on_first_line; i++) {
          if (indented_children[i].length > 1) {
            should_same_line = false;
            break;
          }
        }
        if (should_same_line) {
          for (let i = 1; i < num_on_first_line; i++) {
            first_line.push(indented_children[i][0][1]);
            first_line.push(' ');
          }
          first_line.pop();
          result.push([0, first_line]);
        } else {
          // add the first line stuff but with 2 indents instead of 1
          first_line.pop();
          result.push([0, first_line]);
          for (let i = 1; i < num_on_first_line; i++) {
            for (const line of indented_children[i]) {
              result.push([line[0] + 2, line[1]]);
            }
          }
        }
        // Add the rest of the lines
        for (let i = num_on_first_line; i < indented_children.length; i++) {
          for (const line of indented_children[i]) {
            result.push([line[0] + 1, line[1]]);
          }
        }
        // Put a new ) on its own line instead of stacking ), if we were multiline after all.
        // The only reason for this is that it's easier to code, lol
        if (result.length > 1) {
          result.push([1, ')']);
        } else {
          (result[0][1] as StringTree[]).push(')');
        }
      }
    } else {
      // not too big case
      result.push([0, flatten_expr_to_tree(expr)]);
    }
  } else {
    // it's just a single element, add newline and move on.
    result.push([0, expr[0]]);
  }

  cache.set(expr, result);
  return result;
}

function flatten_tree(tree: StringTree, flat: string[] = []): string[] {
  // While there can be shared trees, we're guaranteed that the string tree is a DAG.
  // If it wasn't, it's unclear what this function should do, anyway.
  if (Array.isArray(tree)) {
    for (const child of tree) {
      flatten_tree(child, flat);
    }
  } else {
    flat.push(tree);
  }
  return flat;
}

function indent_formatted_stringtree(
  formatted: [number, StringTree][],
  indent: string = '  '
): StringTree[] {
  const indented = [];
  for (const line of formatted) {
    indented.push([indent.repeat(line[0]), line[1], '\n']);
  }
  return indented;
}

function concat_stringtree(tree: StringTree[]): string {
  return flatten_tree(tree).join('');
}

export function print<T>(e: SExprT<T>): string {
  return concat_stringtree(
    indent_formatted_stringtree(format_stringexpr(print_to_stringexpr(e)), '  ')
  ).trimEnd();
}
