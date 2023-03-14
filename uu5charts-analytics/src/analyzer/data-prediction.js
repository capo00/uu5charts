//@@viewOn:imports
import { XyChart } from "uu5charts";
import regression from "regression";
import { createVisualComponent, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";

//@@viewOff:imports

const PERCENTAGE = 0.2;
const DEF_PREDICTION = "next";

const DataPrediction = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataPrediction",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value } = useFormApi();
    const { cleanData: data, xAxes, yAxes, regressionType, prediction = DEF_PREDICTION, predictValue } = value;

    let testData = data;
    let predData = [];

    switch (prediction) {
      case "next":
      case "prev":
        const sortedData = [...data].sort(({ [xAxes]: xA }, { [xAxes]: xB }) => xA - xB);
        if (prediction === "next") {
          const index = Math.round(sortedData.length * 0.8);
          testData = sortedData.slice(0, index);
          predData = sortedData.slice(index);
        } else {
          const index = Math.round(sortedData.length * 0.2);
          predData = sortedData.slice(0, index);
          testData = sortedData.slice(index);
        }
        break;
      case "random":
        const predCount = Math.round(data.length * 0.2);
        testData = [...data];

        while (predData.length < predCount) {
          const randomIndex = Utils.Number.random(testData.length);
          predData.push(...testData.splice(randomIndex, 1));
        }
        break;
      case "custom":
        if (predictValue) {
          const xValues = predictValue.replace(",", ".").split(/\s*;\s*/);
          predData = xValues.map((v) => ({ [xAxes]: +v }));
        }
    }

    const regData = testData.map((it) => [it[xAxes], it[yAxes]]);
    const reg = regression[regressionType](regData);

    let displayedData = testData.map((it, i) => ({ ...it, _regression: reg.points[i][1] }));

    const series = [
      { valueKey: yAxes },
      { valueKey: "_regression", color: "red", line: { strokeWidth: 5 }, title: "Regrese" },
    ];

    if (prediction) {
      if (prediction === "prev") {
        displayedData = [
          ...predData.map((it) => ({
            ...it,
            _regression$predict: reg.predict(it[xAxes])[1],
          })),
          ...displayedData,
        ];
      } else {
        displayedData.push(
          ...predData.map((it) => ({
            ...it,
            _regression$predict: reg.predict(it[xAxes])[1],
          }))
        );
      }

      series.push({
        valueKey: "_regression$predict",
        color: "orange",
        ...(["next", "prev"].includes(prediction) ? { line: { strokeWidth: 4 } } : { point: true }),
        title: "Predikce",
      });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="heading" header="Predikce" level={2} {...props}>
        <XyChart
          data={displayedData}
          series={series}
          labelAxis={{ dataKey: xAxes, title: xAxes }}
          valueAxis={{ title: yAxes }}
        />

        <Uu5Forms.FormSwitchSelect
          name="prediction"
          label={{ cs: "Predikce" }}
          initialValue={DEF_PREDICTION}
          itemList={[
            { label: "Doprava", value: "next" },
            { label: "Doleva", value: "prev" },
            { label: "Náhodná", value: "random" },
            { label: "Vlastní", value: "custom" },
          ]}
        />
        {prediction === "custom" && <Uu5Forms.FormText name="predictValue" />}
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataPrediction };
export default DataPrediction;
