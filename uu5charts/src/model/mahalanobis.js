import { mean, isNumeric } from "./mahalanobis/math.js";
import { invert, cov, transpose, multiply } from "./mahalanobis/matrix.js";

// used from https://github.com/veltman/mahalanobis
export function mahalanobis(data) {
  if (!Array.isArray(data) || !data.length) {
    throw new TypeError("Argument must be a non-empty array.");
  }

  data.forEach(function(d) {
    if (
      !Array.isArray(d) ||
      d.length !== data[0].length ||
      !d.every(isNumeric)
    ) {
      throw new TypeError(
        "Argument be an array of arrays of numbers, all the same length."
      );
    }
  });

  if (data.length <= data[0].length) {
    throw new RangeError(
      "Data must have more observations (rows) than features (columns) to compute covariance. Currently has " +
      data.length +
      " observations, " +
      data[0].length +
      " features."
    );
  }

  var columns = transpose(data),
    means = columns.map(mean),
    invertedCovariance = invert(cov(columns, means));

  var distance = function(row) {
    var deltas = row.map(function(d, i) {
      return d - means[i];
    });

    return multiply(multiply(deltas, invertedCovariance), deltas);

    // Mahalanobis in Python/R returns D^2 as result of Mahalanobis
    // return Math.sqrt(multiply(multiply(deltas, invertedCovariance), deltas));
  };

  return {
    all: function() {
      return data.map(distance);
    },
    distance: distance
  };
}
