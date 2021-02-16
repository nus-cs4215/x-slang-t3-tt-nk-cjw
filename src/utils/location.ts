import { formatTable } from './formatters';

export interface Position {
  character: number;
  line: number;
  column: number;
}

export interface Location {
  start: Position;
  end: Position;
}

export function merge_loc(start: Location, end: Location) {
  return { start: start.start, end: end.end };
}

export function format_pos(pos: Position): string {
  return `${pos.line}:${pos.column}`;
}

export function format_loc(loc: Location): string {
  return `${format_pos(loc.start)} to ${format_pos(loc.end)}`;
}

export function highlight_pos(pos: Position, s: string, indent: string = ''): string {
  const line = s.split('\n')[pos.line - 1];
  const highlight_whitespace = line.slice(0, pos.column).replace(/\S/g, ' ');
  return formatTable([
    [indent, pos.line.toString(), ' | ', line],
    [indent, '', ' | ', highlight_whitespace + '^'],
  ]);
}

export function highlight_loc(loc: Location, s: string, indent: string = ''): string {
  const lines = s.split('\n');
  if (loc.start.line === loc.end.line) {
    // single line loc
    const line = lines[loc.start.line - 1];
    const highlight_whitespace = line.slice(0, loc.start.column).replace(/\S/g, ' ');
    return formatTable([
      [indent, loc.start.line.toString(), ' | ', line],
      [
        indent,
        '',
        ' | ',
        `${highlight_whitespace}^${'~'.repeat(Math.max(0, loc.end.column - loc.start.column - 1))}`,
      ],
    ]);
  } else if (loc.start.line + 1 === loc.end.line) {
    // two line loc
    const start_line = lines[loc.start.line - 1];
    const end_line = lines[loc.end.line - 1];
    const highlight_whitespace = start_line.slice(0, loc.start.column).replace(/\S/g, ' ');
    return formatTable([
      [indent, loc.start.line.toString(), ' | ', start_line],
      [
        indent,
        '',
        ' | ',
        `${highlight_whitespace}^${'~'.repeat(
          Math.max(0, start_line.length - loc.start.column - 1)
        )}`,
      ],
      [indent, loc.end.line.toString(), ' | ', end_line],
      [indent, '', ' | ', `${'~'.repeat(loc.end.column)}`],
    ]);
  } else {
    // multiline loc
    const start_line = lines[loc.start.line - 1];
    const end_line = lines[loc.end.line - 1];
    const highlight_whitespace = start_line.slice(0, loc.start.column).replace(/\S/g, ' ');
    return formatTable([
      [indent, loc.start.line.toString(), ' | ', start_line],
      [
        indent,
        '',
        ' | ',
        `${highlight_whitespace}^${'~'.repeat(
          Math.max(0, start_line.length - loc.start.column - 1)
        )}`,
      ],
      [indent, '...', ' | ', '...'],
      [indent, loc.end.line.toString(), ' | ', end_line],
      [indent, '', ' | ', `${'~'.repeat(loc.end.column)}`],
    ]);
  }
}
