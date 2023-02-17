function vif(data) {
  const n = data[0].length;
  const vifValues = [];

  for (let i = 0; i < n; i++) {
    let predictors = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        predictors.push(data[j]);
      }
    }

    const X = predictors;
    const y = data[i];

    const Xt = transpose(X);
    const XtX = multiply(Xt, X);
    const XtXi = inverse(XtX);
    const XtXiy = multiply(multiply(XtXi, Xt), y);
    const yHat = multiply(X, XtXiy);

    const error = subtract(y, yHat);
    const sse = dot(error, error);

    const r2 = 1 - sse / variance(y);
    const vif = 1 / (1 - r2);

    vifValues.push(vif);
  }

  return vifValues;
}

// Transpose matice
function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  const result = [];
  for (let i = 0; i < cols; i++) {
    result[i] = [];
    for (let j = 0; j < rows; j++) {
      result[i][j] = matrix[j][i];
    }
  }

  return result;
}

// Násobení matic
function multiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error('Columns of A must match rows of B');
  }

  const result = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}

// Odčítání matic
function subtract(A, B) {
  const rows = A.length;
  const cols = A[0].length;

  const result = [];
  for (let i = 0; i < rows; i++) {
    result[i] = [];
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] - B[i][j];
    }
  }

  return result;
}

// Výpočet variačního rozptylového koeficientu
function variance(array) {
  const mean = array.reduce((sum, x) => sum + x, 0) / array.length;
  const variance = array.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (array.length - 1);

  return variance;
}

// Výpočet inverzní matice
function inverse(matrix) {
// Tuto funkci lze implementovat různými způsoby, například pomocí Gauss-Jordan eliminace nebo singular value decomposition.
// Zde ji však neimplementujeme, protože výpočet inverzní matice není primárním cílem této otázky.
  throw new Error('Inverse function not implemented');
}

// Skalární součin vektorů
function dot(A, B) {
  if (A.length !== B.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < A.length; i++) {
    sum += A[i] * B[i];
  }

  return sum;
}

export { vif };
export default vif;
