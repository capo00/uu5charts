//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, PropTypes, useState, useUpdateEffect } from "uu5g05";
import Config from "../config/config.js";
import Data from "../model/data";

//@@viewOff:imports

function roundToTens(v) {
  const s = v + "";
  let res;
  const dotIndex = s.indexOf(".");
  if (dotIndex > -1) {
    const numIndex = s.split("").findIndex((v) => v != 0 && v !== ".");
    const resIndex = numIndex - dotIndex;
    const tens = Math.pow(10, resIndex < 0 ? resIndex + 1 : resIndex);
    res = Math.round(v * tens) / tens;
  } else {
    res = Math.round(v);
  }
  return res;
}

function getPredictRange(dataModel, labelKey) {
  const dataModelNoOutliers = new Data(dataModel.filter((item) => !item._outlier));
  let [min, max] = ["min", "max"].map((fn) => dataModelNoOutliers.values(labelKey)[fn]());
  let avgStep = roundToTens(dataModelNoOutliers.values(labelKey).avgStep());
  if (avgStep < 1 && max - min > 10) {
    avgStep = 1;
  }

  let range = [min - avgStep / 10, max + avgStep / 10];

  min -= avgStep;
  min = roundToTens(Math.abs(min)) * (min < 0 ? -1 : 1);

  max += avgStep;
  max = roundToTens(Math.abs(max)) * (max < 0 ? -1 : 1);

  const limit = 5; // TODO dynamic value
  for (let i = 0; i < limit; i++) {
    range.push(min - i * avgStep, max + i * avgStep);
  }

  return range.sort((a, b) => a - b);
}

const Regression = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Regression",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data: propsData, series, labelKey, labelAxis, valueKey, labelPredictList, ...propsToPass } = props;

    const [data] = useState(() => {
      const dataModel = new Data(propsData.map((item) => ({ ...item })));
      dataModel.removeOutliers();

      dataModel.addRegression(valueKey, labelKey, {
        key: "_regression",
        predict: labelPredictList || getPredictRange(dataModel, labelKey),
      });

      return dataModel.filter((it) => !it._outlier);
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <XyChart
        {...propsToPass}
        data={data}
        series={[
          // TODO add rest of series
          { valueKey, ...series?.find((serie) => serie.valueKey === valueKey) },
          { valueKey: "_regression", color: "red", line: { strokeWidth: 5 }, title: "Regrese" },
          { valueKey: "_regression$predict", color: "orange", line: { strokeWidth: 4 }, title: "Predikce" },
        ]}
        labelAxis={{ dataKey: labelKey, ...labelAxis }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Regression };
export default Regression;
