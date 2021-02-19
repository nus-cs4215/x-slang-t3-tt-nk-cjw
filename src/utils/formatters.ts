function interleave<T>(xs: T[], sep: T): T[] {
  const result: T[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    result.push(xs[i]);
    result.push(sep);
  }
  result.push(xs[xs.length - 1]);
  return result;
}

export function formatTable(
  t: string[][],
  options: { headers?: string[]; sep?: string; prefix?: string } = {}
): string {
  if (t.length === 0) {
    return '';
  }

  let { headers } = options;
  const { sep, prefix } = options;

  if (sep !== undefined) {
    if (headers !== undefined) {
      headers = interleave(headers, sep);
    }
    t = t.map((row) => interleave(row, sep));
  }

  const widths = t[0].map((_, i) => {
    if (headers === undefined) {
      return Math.max(...t.map((r) => r[i].length));
    } else {
      return Math.max(headers[i].length, ...t.map((r) => r[i].length));
    }
  });

  const strs: string[] = [];

  if (prefix !== undefined) {
    strs.push(prefix);
  }

  if (headers !== undefined) {
    for (let c = 0; c < headers.length - 1; c++) {
      strs.push(headers[c] + ' '.repeat(widths[c] - headers[c].length));
    }
    strs.push(headers[headers.length - 1]);
    strs.push('\n');
    strs.push('-'.repeat(widths.reduce((x, y) => x + y, 0)));
    strs.push('\n');
  }

  t.forEach((row: string[]) => {
    // pad everything except last column in table
    // for now assume everything is left aligned
    for (let c = 0; c < row.length - 1; c++) {
      strs.push(row[c] + ' '.repeat(widths[c] - row[c].length));
    }
    strs.push(row[row.length - 1]);

    // add newline column
    strs.push('\n');
  });

  return ''.concat(...strs);
}
