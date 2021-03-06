export function get_arguments(func: Function) {
  return func
    .toString()
    .replace(/\s+/g, '') // strip white space
    .replace(/{.*/, '') // strip body
    .replace(/=>.*/, '') // strip body
    .replace(/^[^(]*[(]/, '') // extract the parameters
    .replace(/[)][^)]*$/, '') // extract the parameters
    .replace(/=[^,]+/g, '') // strip any ES6 defaults
    .split(',');
  // return (func + '')
  //   .replace(/[/][/].*$/gm, '') // strip single-line comments
  //   .replace(/\s+/g, '') // strip white space
  //   .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
  //   .split('){', 1)[0]
  //   .replace(/^[^(]*[(]/, '') // extract the parameters
  //   .replace(/=[^,]+/g, '') // strip any ES6 defaults
  //   .split(',')
  //   .filter(Boolean); // split & filter [""]
}
