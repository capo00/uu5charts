import jStat from "jstat";
import { isNumeric } from "./math";

function dot(a, b) {
  if (a.length !== b.length) {
    throw new TypeError("Vectors are of different sizes");
  }

  return jStat.sum(
    a.map(function (x, i) {
      return x * b[i];
    })
  );
}

export function multiply(a, b) {
  var aSize = a.every(isNumeric) ? 1 : a.length,
    bSize = b.every(isNumeric) ? 1 : b.length;

  if (aSize === 1) {
    if (bSize === 1) {
      return dot(a, b);
    }
    return b.map(function (row) {
      return dot(a, row);
    });
  }

  if (bSize === 1) {
    return a.map(function (row) {
      return dot(row, b);
    });
  }

  return a.map(function (x) {
    return jStat.transpose(b).map(function (y) {
      return dot(x, y);
    });
  });
}

export function cov(columns, means) {
  return columns.map(function (c1, i) {
    return columns.map(function (c2, j) {
      var terms = c1.map(function (x, k) {
        return (x - means[i]) * (c2[k] - means[j]);
      });

      return jStat.sum(terms) / (c1.length - 1);
    });
  });
}

export function cor(columns) {
  const n = columns[0].length;
  const corrs = Array(columns.length)
    .fill()
    .map(() => Array(columns.length).fill(NaN));
  for (let i = 0; i < columns.length; i++) {
    for (let j = i; j < columns.length; j++) {
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0,
        sumY2 = 0;
      for (let k = 0; k < n; k++) {
        const x = columns[i][k];
        const y = columns[j][k];
        if (Number.isFinite(x) && Number.isFinite(y)) {
          sumX += x;
          sumY += y;
          sumXY += x * y;
          sumX2 += x * x;
          sumY2 += y * y;
        }
      }
      const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      if (denom === 0) {
        corrs[i][j] = corrs[j][i] = NaN;
      } else {
        const corr = (n * sumXY - sumX * sumY) / denom;
        corrs[i][j] = corrs[j][i] = corr;
      }
    }
  }
  return corrs;
}

export function invert(matrix) {
  var size = matrix.length,
    base,
    swap,
    augmented;

  // Augment w/ identity matrix
  augmented = matrix.map(function (row, i) {
    return row.slice(0).concat(
      row.slice(0).map(function (d, j) {
        return j === i ? 1 : 0;
      })
    );
  });

  // Process each row
  for (var r = 0; r < size; r++) {
    base = augmented[r][r];

    // Zero on diagonal, swap with a lower row
    if (!base) {
      for (var rr = r + 1; rr < size; rr++) {
        if (augmented[rr][r]) {
          // swap
          swap = augmented[rr];
          augmented[rr] = augmented[r];
          augmented[r] = swap;
          base = augmented[r][r];
          break;
        }
      }

      if (!base) {
        throw new RangeError("Matrix not invertable.");
      }
    }

    // 1 on the diagonal
    for (var c = 0; c < size * 2; c++) {
      augmented[r][c] = augmented[r][c] / base;
    }

    // Zeroes elsewhere
    for (var q = 0; q < size; q++) {
      if (q !== r) {
        base = augmented[q][r];

        for (var p = 0; p < size * 2; p++) {
          augmented[q][p] -= base * augmented[r][p];
        }
      }
    }
  }

  return augmented.map(function (row) {
    return row.slice(size);
  });
}
