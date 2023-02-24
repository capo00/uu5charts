import regression from "regression";
import { Utils } from "uu5g05";
import { mahalanobis } from "./mahalanobis";
import { mean, median } from "./statistics";
import TensorFlow from "./tensor-flow";
import ChiSquare from "./mahalanobis/chi-square";

export const getMahalanobisDistance = mahalanobis;
export const OUTLIERS_ALPHA = 0.0001;

export function getHistogram(data, key, bins = 20) {
  const values = data.map((item) => item[key]);
  const min = Math.floor(Math.min(...values));
  const max = Math.ceil(Math.max(...values));

  const binSize = Math.ceil((max - min) / bins);

  const histData = [];
  data.forEach((item) => {
    const v = item[key];

    for (let i = 0; i < bins; i++) {
      const locMin = min + i * binSize;
      const locMax = locMin + binSize;

      histData[i] ||= { min: locMin, max: locMax, label: locMin + binSize / 2, binSize, value: 0, data: [] };
      if (v >= locMin && v < locMax) {
        histData[i].value++;
        histData[i].data.push(item);
      }
    }
  });

  return histData;
}

const ROUNDER = 10 ** 10;

class Values extends Array {
  constructor(values) {
    if (Array.isArray(values)) {
      super(...values);
      this._isNumeric = typeof values.find((v) => v === 0 || v) === "number";
    } else {
      super(values);
    }

    this._min = undefined;
    this._max = undefined;
    this._mean = undefined;
    this._sampleVariance = undefined;
    this._sampleStandardDeviation = undefined;
    this._avgStep = undefined;
    this._isUnique = undefined;
  }

  isNumeric() {
    return this._isNumeric;
  }

  filled() {
    return (this._filled ||= this.filter((it) => it != null && it !== ""));
  }

  min() {
    return this.isNumeric() && this._min == null ? (this._min = Math.min(...this.filled())) : this._min;
  }

  max() {
    return this.isNumeric() && this._max == null ? (this._max = Math.max(...this.filled())) : this._max;
  }

  sum() {
    if (this.isNumeric() && this._sum == null) {
      const value = this.filled().reduce((s, v) => s + v, 0);
      this._sum = Math.round(value * ROUNDER) / ROUNDER;
    }
    return this._sum;
  }

  mean() {
    if (this.isNumeric() && this._mean == null) {
      const value = mean(...this.filled());
      this._mean = Math.round(value * ROUNDER) / ROUNDER;
    }
    return this._mean;
  }

  median() {
    if (this.isNumeric() && this._median == null) {
      this._median = median(...this.filled());
    }
    return this._median;
  }

  // Median absolute deviation
  mad() {
    if (this.isNumeric() && this._mad == null) {
      // median(|xi - mean(x)|)
      const mean = this.mean();
      const value = median(...this.filled().map((xi) => Math.abs(xi - mean)));
      this._mad = Math.round(value * ROUNDER) / ROUNDER;
    }
    return this._mad;
  }

  isUnique() {
    if (this._isUnique == null) {
      this._isUnique = this.length === new Set(this).size;
    }
    return this._isUnique;
  }

  // variance() {
  //   const mean = this.reduce((acc, curr) => acc + curr, 0) / this.length;
  //   return this.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / this.length;
  // }

  sampleVariance() {
    if (this.isNumeric() && this._sampleVariance == null) {
      const mean = this.mean();

      // Calculate the sum of the squared differences from the mean
      const sumSquaredDiffs = this.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);

      // Divide by n-1 to get the sample variance
      this._sampleVariance = sumSquaredDiffs / (this.length - 1);
    }
    return this._sampleVariance;
  }

  // směrodatná odchylka
  sampleStandardDeviation() {
    if (this.isNumeric() && this._sampleStandardDeviation == null) {
      this._sampleStandardDeviation = Math.pow(this.sampleVariance(), 0.5);
    }
    return this._sampleStandardDeviation;
  }

  // variační koeficient
  sampleVarianceCoefficient() {
    if (this.isNumeric() && this._varianceCoefficient == null) {
      this._varianceCoefficient = this.sampleStandardDeviation() / this.mean();
    }
    return this._varianceCoefficient;
  }

  getHistogram(bins = 20) {
    if (this.isNumeric()) {
      const min = Math.floor(this.min());
      const max = Math.ceil(this.max());
      const binSize = Math.ceil((max - min) / bins);

      const histData = [];
      this.forEach((v, j) => {
        for (let i = 0; i < bins; i++) {
          const locMin = min + i * binSize;
          const locMax = locMin + binSize;

          histData[i] ||= { min: locMin, max: locMax, label: locMin + binSize / 2, binSize, value: 0, data: [] };
          if (v >= locMin && v < locMax) {
            histData[i].value++;
            histData[i].data.push(j);
          }
        }
      });

      return histData;
    }
  }

  avgStep() {
    if (this.isNumeric() && this._avgStep == null) {
      let sum = 0;
      for (let i = 1; i < this.length; i++) {
        sum += this[i] - this[i - 1];
      }
      return sum / (this.length - 1);
    }
    return this._avgStep;
  }
}

class Data extends Array {
  constructor(data) {
    Array.isArray(data) ? super(...data) : super(data);

    this._keys = [];
    this._values = {};

    this._uniqueKeys = undefined;

    this._quantitativeKeys = undefined;
    this._hasQuantitative = false;

    this._hasMahalanobisDistance = false;
    this._histogram = {};

    this.outliersLimit = undefined;
  }

  keys() {
    if (!this._keys.length) {
      const keys = new Set();
      // TODO optimize (e.g. each forEach or map can prepare keys too)
      this.forEach((item) => Object.keys(item).forEach((k) => !/^_/.test(k) && keys.add(k)));
      this._keys = [...keys];
    }
    return this._keys;
  }

  values(key) {
    return (this._values[key] ||= new Values(this.map((item) => item[key])));
  }

  getUniqueKeys() {
    if (this._uniqueKeys == null) {
      this._uniqueKeys = this.keys().filter((k) => this.values(k).isUnique());
    }
    return this._uniqueKeys;
  }

  getDuplicated() {
    if (this._duplicated == null) {
      const keys = this.keys();
      const duplicates = this.filter(
        (item, i, arr) => i !== arr.findIndex((it) => Utils.Object.shallowEqual(item, it))
      );
      this._duplicated = duplicates.sort((a, b) => (a[keys[0]] > b[keys[0]] ? 1 : a[keys[0]] < b[keys[0]] ? -1 : 0));
    }
    return this._duplicated;
  }

  getHistogram(key, bins = 10) {
    if (!this._histogram[key]?.[bins]) {
      const values = this.values(key);
      const min = Math.floor(values.min());
      const max = Math.ceil(values.max());
      const binSize = Math.ceil((max - min) / bins);

      const histData = [];
      this.forEach((item) => {
        const v = item[key];
        if (v != null) {
          for (let i = 0; i < bins; i++) {
            const locMin = min + i * binSize;
            const locMax = locMin + binSize;

            histData[i] ||= { min: locMin, max: locMax, label: locMin + binSize / 2, binSize, value: 0, data: [] };
            if (v >= locMin && v < locMax) {
              histData[i].value++;
              histData[i].data.push(item);
            }
          }
        }
      });
      this._histogram[key] ||= {};
      this._histogram[key][bins] = histData;
    }

    return this._histogram[key][bins];
  }

  getQuantitativeKeys() {
    if (!this._quantitativeKeys) {
      this._quantitativeKeys = this.keys().filter((key) => this.values(key).isNumeric());
    }

    return this._quantitativeKeys;
  }

  addQuantitative() {
    if (!this._hasQuantitative) {
      const quantitativeKeys = this.getQuantitativeKeys();
      if (quantitativeKeys.length) {
        this.forEach((item) => {
          const quantitativeValues = [];
          for (let key of quantitativeKeys) {
            if (typeof item[key] === "number") quantitativeValues.push(item[key]);
            else break;
          }
          if (quantitativeValues.length === quantitativeKeys.length) {
            item._quantitativeValues = quantitativeValues;
          }
        });
        this._hasQuantitative = true;
      }
    }

    return this;
  }

  addMahalanobisDistance() {
    if (!this._hasMahalanobisDistance) {
      this.addQuantitative();

      const quantitativeData = this.filter((it) => it._quantitativeValues);

      const distanceList = mahalanobis(quantitativeData.map(({ _quantitativeValues }) => _quantitativeValues)).all();
      distanceList.forEach((distance, i) => (quantitativeData[i]._distance = distance));

      this._hasMahalanobisDistance = true;
    }

    return this;
  }

  removeOutliers({ max, alpha = OUTLIERS_ALPHA, strict = false } = {}) {
    this.addMahalanobisDistance();

    // const values = this.values("_distance");
    // const median = values.median();
    // const mad = values.mad();
    // const min = 0;
    // const max = median + 6 * mad; // 6 is chosen constant

    const min = 0;
    // higher alpha (0.001) means more outliers and power regression
    max ||= ChiSquare.inv(2, alpha);
    this.outliersLimit = max;

    if (strict) {
      return this._removeIf((it) => !it._distance || min > it._distance || it._distance > max);
    } else {
      const outliers = [];
      this.forEach((it) => {
        it._outlier = !it._distance || min > it._distance || it._distance > max;
        if (it._outlier) outliers.push(it);
      });
      return outliers;
    }
  }

  addRegression(y, x, { key = `${y}~${x}`, predict } = {}) {
    const regData = this.map((it) => (it._outlier || it._predict ? undefined : [it[x], it[y]])).filter(Boolean);
    const regressions = ["linear", "exponential", "logarithmic", "power", "polynomial"].map((name) => {
      const reg = regression[name](regData);
      reg.name = name;
      return reg;
    });
    // sort by R^2
    regressions.sort((a, b) => b.r2 - a.r2);
    // choose 1st regression with the higher R^2
    const reg = regressions[0];

    let i = 0;
    this.forEach((it) => {
      if (!it._outlier) {
        it[key] = reg.points[i][1];
        i++;
      }
    });

    if (predict) {
      const a = [];
      predict.forEach((v) => {
        const r = reg.predict(v)[1];
        a.push(r);
        this.push({
          [x]: v,
          [key + "$predict"]: r,
          _predict: true,
        });
      });
    }
  }

  async addTF(y, x, { key = `${y}~${x}`, predict } = {}) {
    const regData = this.filter((it) => !it._outlier && !it._predict);
    const data = regData.map((car) => ({ x: car[x], y: car[y] }));

    const model = new TensorFlow(data);

    await model.train();

    this.forEach((it) => {
      if (!it._outlier && !it._predict) {
        it[key] = model.predict([it[x]])[0];
      }
    });

    if (predict) {
      this.push(...model.predict(predict).map((y, i) => ({ [x]: predict[i], [key + "$predict"]: y, _predict: true })));
    }
  }

  _removeIf(callback) {
    let i = this.length;
    const removed = [];
    while (i--) {
      if (callback(this[i], i)) {
        removed.push(this[i]);
        this.splice(i, 1);
      }
    }
    return removed;
  }
}

export { Data, Values };
export default Data;