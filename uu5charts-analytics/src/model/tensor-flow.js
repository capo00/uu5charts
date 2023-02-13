import * as tf from "@tensorflow/tfjs";

/**
 * Convert the input data to tensors that we can use for machine
 * learning. We will also do the important best practices of _shuffling_
 * the data and _normalizing_ the data
 * MPG on the y-axis.
 */
function convertToTensor(data) {
  // Wrapping these calculations in a tidy will dispose any
  // intermediate tensors.

  return tf.tidy(() => {
    // Step 1. Shuffle the data
    tf.util.shuffle(data);

    // Step 2. Convert data to Tensor
    const xs = data.map(({ x }) => x);
    const ys = data.map(({ y }) => y);

    const xsTf = tf.tensor2d(xs, [xs.length, 1]);
    const ysTf = tf.tensor2d(ys, [ys.length, 1]);

    // Step 3. Normalize the data to the range 0 - 1 using min-max scaling
    const xMax = xsTf.max();
    const xMin = xsTf.min();
    const yMax = ysTf.max();
    const yMin = ysTf.min();

    const xsNorm = xsTf.sub(xMin).div(xMax.sub(xMin));
    const ysNorm = ysTf.sub(yMin).div(yMax.sub(yMin));

    return {
      xs,
      xsNorm,
      ys,
      ysNorm,
      // Return the min/max bounds, so we can use them later.
      xMax,
      xMin,
      yMax,
      yMin,
    };
  });
}

class TensorFlow {
  constructor(data) {
    // Create a sequential model
    const model = tf.sequential();

    // Add a single input layer
    model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));

    // Add an output layer
    model.add(tf.layers.dense({ units: 1, useBias: true }));

    // Prepare the model for training.
    model.compile({
      optimizer: tf.train.adam(),
      loss: tf.losses.meanSquaredError,
      metrics: ["mse"],
    });

    const { xs, ys, xMin, xMax, yMin, yMax, xsNorm, ysNorm } = convertToTensor(data);

    this.model = model;
    this.xs = xs;
    this.ys = ys;
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.xsNorm = xsNorm;
    this.ysNorm = ysNorm;
  }

  async train() {
    await this.model.fit(this.xsNorm, this.ysNorm, {
      batchSize: 32,
      epochs: 50,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}, mse = ${log.mse}`),
      },
    });
  }

  predict(xList) {
    // Generate predictions for a uniform range of numbers between 0 and 1;
    // We un-normalize the data by doing the inverse of the min-max scaling
    // that we did earlier.
    const yList = tf.tidy(() => {
      const xs = tf.tensor2d(xList, [xList.length, 1]);
      const xMax = this.xMax; //xs.max();
      const xMin = this.xMin; //xs.min();
      const xsNorm = xs.sub(xMin).div(xMax.sub(xMin));
      const predictions = this.model.predict(xsNorm.reshape([xsNorm.size, 1]));

      const unNormPreds = predictions.mul(this.yMax.sub(this.yMin)).add(this.yMin);

      // Un-normalize the data
      return unNormPreds.dataSync();
    });

    return [...yList];
  }
}

export { TensorFlow };
export default TensorFlow;
