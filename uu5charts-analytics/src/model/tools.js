export function round(num, precision = 2) {
  return Math.round(num * 10 ** precision) / 10 ** precision;
}
