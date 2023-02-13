export function mean(arr) {
  return sum(arr) / arr.length;
}

export function sum(arr) {
  return arr.reduce((a, b) => a + b);
}

export function isNumeric(n) {
  return typeof n === "number" && !isNaN(n);
}
