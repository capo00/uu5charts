function gammaln(x) {
  var j = 0;
  var cof = [
    // eslint-disable-next-line no-loss-of-precision
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  var ser = 1.000000000190015;
  var xx, y, tmp;
  tmp = (y = xx = x) + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  for (; j < 6; j++) ser += cof[j] / ++y;
  // eslint-disable-next-line no-loss-of-precision
  return Math.log((2.5066282746310005 * ser) / xx) - tmp;
}

function lowRegGamma(a, x) {
  var aln = gammaln(a);
  var ap = a;
  var sum = 1 / a;
  var del = sum;
  var b = x + 1 - a;
  var c = 1 / 1.0e-30;
  var d = 1 / b;
  var h = d;
  var i = 1;
  // calculate maximum number of itterations required for a
  var ITMAX = -~(Math.log(a >= 1 ? a : 1 / a) * 8.5 + a * 0.4 + 17);
  var an;

  if (x < 0 || a <= 0) {
    return NaN;
  } else if (x < a + 1) {
    for (; i <= ITMAX; i++) {
      sum += del *= x / ++ap;
    }
    return sum * Math.exp(-x + a * Math.log(x) - aln);
  }

  for (; i <= ITMAX; i++) {
    an = -i * (i - a);
    b += 2;
    d = an * d + b;
    c = b + an / c;
    d = 1 / d;
    h *= d * c;
  }

  return 1 - h * Math.exp(-x + a * Math.log(x) - aln);
}

function gammapinv(p, a) {
  var j = 0;
  var a1 = a - 1;
  var EPS = 1e-8;
  var gln = gammaln(a);
  var x, err, t, u, pp, lna1, afac;

  if (p >= 1) return Math.max(100, a + 100 * Math.sqrt(a));
  if (p <= 0) return 0;
  if (a > 1) {
    lna1 = Math.log(a1);
    afac = Math.exp(a1 * (lna1 - 1) - gln);
    pp = p < 0.5 ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
    if (p < 0.5) x = -x;
    x = Math.max(1e-3, a * Math.pow(1 - 1 / (9 * a) - x / (3 * Math.sqrt(a)), 3));
  } else {
    t = 1 - a * (0.253 + a * 0.12);
    if (p < t) x = Math.pow(p / t, 1 / a);
    else x = 1 - Math.log(1 - (p - t) / (1 - t));
  }

  for (; j < 12; j++) {
    if (x <= 0) return 0;
    err = lowRegGamma(a, x) - p;
    if (a > 1) t = afac * Math.exp(-(x - a1) + a1 * (Math.log(x) - lna1));
    else t = Math.exp(-x + a1 * Math.log(x) - gln);
    u = err / t;
    x -= t = u / (1 - 0.5 * Math.min(1, u * ((a - 1) / x - 1)));
    if (x <= 0) x = 0.5 * (x + t);
    if (Math.abs(t) < EPS * x) break;
  }

  return x;
}

class ChiSquare {
  // copied from https://github.com/jstat/jstat
  static inv(p, alpha = 0.05) {
    return 2 * gammapinv(1 - alpha, 0.5 * p);
  }
}

export default ChiSquare;
