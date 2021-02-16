function templateToString(content: TemplateStringsArray | string, variables: any[]): string {
  if (typeof content === 'string') {
    return content;
  }
  return variables.reduce(
    (built: string, fragment: string, index: number) => built + fragment + content[index + 1],
    content[0]
  );
}

export function stripIndent(content: TemplateStringsArray | string, ...variables: any[]): string {
  const result = templateToString(content, variables);
  const match = result.match(/^[^\S\n]*(?=\S)/gm);
  const indent = match && Math.min(...match.map((el) => el.length));
  if (indent) {
    return result.replace(new RegExp(`^.{${indent}}`, 'gm'), '').trim();
  }
  return result.trim();
}

export function formatTable(t: string[][]): string {
  if (t.length === 0) {
    return '';
  }

  const widths = t[0].map((c, i) => {
    c; // unused
    return Math.max(...t.map((r) => r[i].length));
  });

  const strs: string[] = [];
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
