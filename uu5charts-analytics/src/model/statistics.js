export function mean(...args) {
  return args.reduce((a, b) => a + b, 0) / args.length;
}

export function median(...args) {
  args.sort((a, b) => a - b);
  const middle = Math.floor(args.length / 2);
  return args.length % 2 === 0 ? (args[middle - 1] + args[middle]) / 2 : args[middle];
}
