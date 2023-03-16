import jStat from "jstat";
import { Utils } from "uu5g05";
import { round } from "./tools";

function mae(predicted, actual) {
  return predicted.reduce((sum, v, i) => sum + Math.abs(v - actual[i]), 0) / predicted.length;
}

function mape(predicted, actual) {
  return (predicted.reduce((sum, v, i) => sum + Math.abs(v - actual[i]) / actual[i], 0) / predicted.length) * 100;
}

function summary(model, { name, formula, predict }) {
  const { coef, t, R2, adjust_R2, f, resid, predict: points, endog, SSR, SSE, SST, nobs } = model;
  const variables = coef.map((estimate, i) => ({
    estimate,
    stdError: t.se[i],
    tValue: t.t[i],
    pValue: t.p[i],
    interval95: t.interval95[i],
  }));

  const result = {
    name,
    formula: Utils.String.format(formula, {
      b0: round(variables[0].estimate),
      b1: round(variables[1]?.estimate),
      b2: round(variables[2]?.estimate),
    }),
    variables,
    r2: R2,
    r2Adj: adjust_R2,
    fTest: f.F_statistic,
    pValue: f.pvalue,
    residuals: resid,
    sigma: t.sigmaHat, // residual standard error
    predict: predict(...coef),
    predictMin: predict(...t.interval95.map((arr) => arr[0])),
    predictMax: predict(...t.interval95.map((arr) => arr[1])),
    points,
    mae: mae(points, endog),
    mape: mape(points, endog),
    rmse: Math.sqrt(SSR / nobs),
    _model: model,
  };

  // console.table(variables);
  // console.log(result, model);

  return result;
}

const Regression = {
  linear(data, xAxes, yAxes) {
    const x = [];
    const y = [];

    data.forEach((it) => {
      x.push([1, it[xAxes]]);
      y.push(it[yAxes]);
    });

    const model = jStat.models.ols(y, x);
    return summary(model, { name: "linear", formula: "y = ${b0} + ${b1}x", predict: (b0, b1) => (x) => b0 + b1 * x });
  },

  polynomial(data, xAxes, yAxes) {
    const x = [];
    const y = [];

    data.forEach((it) => {
      x.push([1, it[xAxes], it[xAxes] ** 2]);
      y.push(it[yAxes]);
    });

    const model = jStat.models.ols(y, x);
    return summary(model, {
      name: "polynomial",
      formula: "y = ${b0} + ${b1}x + ${b2}x^2",
      predict: (b0, b1, b2) => (x) => b0 + b1 * x + b2 * x ** 2,
    });
  },

  invert(data, xAxes, yAxes) {
    const x = [];
    const y = [];

    data.forEach((it) => {
      x.push([1, 1 / it[xAxes]]);
      y.push(it[yAxes]);
    });

    const model = jStat.models.ols(y, x);
    return summary(model, { name: "invert", formula: "y = ${b0} + ${b1}/x", predict: (b0, b1) => (x) => b0 + b1 / x });
  },

  logarithmic(data, xAxes, yAxes) {
    const x = [];
    const y = [];

    data.forEach((it) => {
      x.push([1, Math.log(it[xAxes])]);
      y.push(it[yAxes]);
    });

    const model = jStat.models.ols(y, x);
    return summary(model, {
      name: "logarithmic",
      formula: "y = ${b0} + ${b1} * ln(x)",
      predict: (b0, b1) => (x) => b0 + b1 * Math.log(x),
    });
  },

  power(data, xAxes, yAxes) {
    const x = [];
    const y = [];

    data.forEach((it) => {
      x.push([1, Math.log(it[xAxes])]);
      y.push(Math.log(it[yAxes]));
    });

    const model = jStat.models.ols(y, x);
    const sum = summary(model, {
      name: "power",
      formula: "y = ${b0} + x^${b1}",
      predict: (b0, b1) => (x) => b0 + x ** b1,
    });

    sum.points = sum.points.map(Math.exp);

    return sum;
  },

  exponential(data, xAxes, yAxes) {
    const x = [];
    const y = [];

    data.forEach((it) => {
      x.push([1, it[xAxes]]);
      y.push(Math.log(it[yAxes]));
    });

    const model = jStat.models.ols(y, x);
    const sum = summary(model, {
      name: "exponential",
      formula: "y = ${b0} + e^(${b1}x)",
      predict: (b0, b1) => (x) => b0 + Math.exp(b1 * x),
    });

    sum.points = sum.points.map(Math.exp);

    return sum;
  },
};

export default Regression;
