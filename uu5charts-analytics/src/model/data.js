import regression from "regression";
import { mahalanobis } from "./mahalanobis";
import { mean, median } from "./statistics";
import TensorFlow from "./tensor-flow";
import ChiSquare from "./mahalanobis/chi-square";

export const getMahalanobisDistance = mahalanobis;

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
    this._avgStep = undefined;
  }

  isNumeric() {
    return this._isNumeric;
  }

  filled() {
    return (this._filled ||= this.filter((it) => !!it));
  }

  min() {
    return this.isNumeric() && this._min == null ? (this._min = Math.min(...this.filled())) : this._min;
  }

  max() {
    return this.isNumeric() && this._max == null ? (this._max = Math.max(...this.filled())) : this._max;
  }

  sum() {
    return this.isNumeric() && this._sum == null ? (this._sum = this.filled().reduce((s, v) => s + v, 0)) : this._sum;
  }

  mean() {
    return this.isNumeric() && this._mean == null ? (this._mean = mean(...this.filled())) : this._mean;
  }

  median() {
    return this.isNumeric() && this._median == null ? (this._median = median(...this.filled())) : this._median;
  }

  // Median absolute deviation
  mad() {
    if (this.isNumeric() && this._mad == null) {
      // median(|xi - mean(x)|)
      const mean = this.mean();
      this._mad = median(...this.filled().map((xi) => Math.abs(xi - mean)));
    }
    return this._mad;
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

    this._values = {};

    this._quantitativeKeys = undefined;
    this._hasQuantitative = false;

    this._hasMahalanobisDistance = false;
    this._histogram = {};

    this.outliersLimit = undefined;
  }

  values(key) {
    return (this._values[key] ||= new Values(this.map((item) => item[key])));
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
      // keys with numeric values
      const quantitativeKeys = new Set();

      // find numeric keys
      this.forEach((row) => {
        Object.keys(row).forEach((k) => {
          const v = row[k];
          if (v == null || typeof v === "number") quantitativeKeys.add(k);
        });
      });

      this._quantitativeKeys = [...quantitativeKeys];
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

  removeOutliers(strict = false) {
    this.addMahalanobisDistance();

    // const values = this.values("_distance");
    // const median = values.median();
    // const mad = values.mad();
    // const min = 0;
    // const max = median + 6 * mad; // 6 is chosen constant

    const min = 0;
    // higher alpha (0.001) means more outliers and power regression
    const max = ChiSquare.inv(2, 0.0001);
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
