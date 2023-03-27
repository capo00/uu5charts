//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, useMemo, Utils, Fragment } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import Regression from "../model/regression";
import withControlledInput from "./with-controlled-input";
import { round } from "../model/tools";

//@@viewOff:imports

const PRED_DATA_PERCENTAGE = 0.2;

const PRED_TYPE_MAP = {
  prev: "Předchozí",
  next: "Následující",
  random: "Náhodné",
  custom: "Vlastní",
};

const predTypeKeys = Object.keys(PRED_TYPE_MAP);

class DataModel {
  constructor(testData, { xAxes, yAxes, type, predictData }) {
    const reg = Regression[type](testData, xAxes, yAxes);

    this.testData = testData.map((it, i) => ({ ...it, _regression: reg.points[i] }));
    this.mae = reg.mae;
    this.mape = reg.mape;
    this.rmse = reg.rmse;
    this.formula = reg.formula;

    this._xAxes = xAxes;
    this._yAxes = yAxes;
    this.reg = reg;
    this._predictData = predictData;
  }

  predictData(data = this._predictData) {
    if (data?.length && this._predictDataFull !== data) {
      this._predictDataFull = data.map((it) => ({
        ...it,
        _regression$predict: this.reg.predict(it[this._xAxes]),
        _regression$min: this.reg.predictMin(it[this._xAxes]),
        _regression$max: this.reg.predictMax(it[this._xAxes]),
      }));
    }
    return this._predictDataFull;
  }
}

function buildDataMap(data, xAxes, yAxes, regressionType) {
  const regMap = {};

  predTypeKeys.forEach((prediction) => {
    let testData = data;
    let predictData = [];

    switch (prediction) {
      case "next":
      case "prev":
        const sortedData = [...data].sort(({ [xAxes]: xA }, { [xAxes]: xB }) => xA - xB);
        if (prediction === "next") {
          const index = Math.round(sortedData.length * (1 - PRED_DATA_PERCENTAGE));
          testData = sortedData.slice(0, index);
          predictData = sortedData.slice(index);
        } else {
          const index = Math.round(sortedData.length * PRED_DATA_PERCENTAGE);
          predictData = sortedData.slice(0, index);
          testData = sortedData.slice(index);
        }
        break;
      case "random":
        const predCount = Math.round(data.length * PRED_DATA_PERCENTAGE);
        testData = [...data];

        while (predictData.length < predCount) {
          const randomIndex = Utils.Number.random(testData.length);
          predictData.push(...testData.splice(randomIndex, 1));
        }
        break;
    }

    regMap[prediction] = new DataModel(testData, { xAxes, yAxes, type: regressionType, predictData });
  });

  return regMap;
}

function findTheBestPrediction(dataMap) {
  return Object.keys(dataMap).sort((a, b) => a.mae + a.mape + a.rmse - (b.mae + b.mape + b.rmse))[0];
}

const TextInput = withControlledInput(Uu5Forms.Text);

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
    const { value, setItemValue } = useFormApi();
    const { cleanData: data, xAxes, yAxes, regressionType, predictValue } = value;

    const dataMap = useMemo(
      () => buildDataMap(data, xAxes, yAxes, regressionType),
      [data, xAxes, yAxes, regressionType]
    );

    const { prediction = findTheBestPrediction(dataMap) } = value;

    const dataModel = dataMap[prediction];
    const testData = dataModel.testData;
    const predData = dataModel.predictData(
      prediction === "custom"
        ? predictValue
          ?.replace(",", ".")
          ?.split(/\s*;\s*/)
          ?.map((v) => ({ [xAxes]: +v }))
        : undefined
    );

    const series = [
      { valueKey: yAxes },
      { valueKey: "_regression", color: "purple", line: { strokeWidth: 2, type: "monotone" }, title: "Regrese" },
    ];

    let isTwoCharts = ["random", "custom"].includes(prediction);

    let displayedData = testData;

    const predSeries = [
      { valueKey: "_regression$max", color: "orange", area: { fillOpacity: 0.2, type: "monotone" }, title: "max 95%" },
      { valueKey: "_regression$min", color: "#fff", area: { fillOpacity: 1, type: "monotone" }, title: "min 95%" },
      {
        valueKey: "_regression$predict",
        color: "orange",
        title: "Predikce",
        line: { strokeWidth: 5, type: "monotone", point: prediction === "custom" },
      },
    ];

    if (prediction === "prev") {
      displayedData = [...predData, ...displayedData];
      series.push(...predSeries);
    } else if (prediction === "next") {
      displayedData.push(...predData);
      series.push(...predSeries);
    } else if (prediction === "random") {
      predSeries.unshift({ valueKey: yAxes });
    }

    const customLabel = `Vlastní hodnoty pro ${xAxes}`;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Block
        headerType="heading"
        header={"Predikce - " + Config.REG_TYPE_MAP[regressionType] + " regrese"}
        level={2}
        {...props}
      >
        <Uu5Elements.Grid
          templateColumns={{ xs: "1fr", m: "1fr 1fr" }}
          columnGap={16}
          rowGap={16}
          templateAreas={{ xs: "prediction, stats, predictValue", m: "prediction predictValue, stats ." }}
        >
          <Uu5Forms.FormSwitchSelect
            name="prediction"
            initialValue={prediction}
            itemList={predTypeKeys.map((value) => ({ value, children: PRED_TYPE_MAP[value] }))}
            className={Config.Css.css({ gridArea: "prediction" })}
          />
          {prediction === "custom" && (
            <TextInput
              name="predictValue"
              placeholder={{ cs: customLabel }}
              value={predictValue}
              onBlur={(e) => setItemValue("predictValue", e.data.value)}
              className={Config.Css.css({ gridArea: "predictValue" })}
            />
          )}
          <Uu5Elements.Grid
            templateColumns="repeat(4, 1fr)"
            columnGap={4}
            rowGap={4}
            className={Config.Css.css({ gridArea: "stats", padding: 8, justifyItems: "end" })}
          >
            {["MAE", "MAPE", "RMSE"].map((fn) => (
              <Fragment key={fn}>
                {predTypeKeys.map((predKey, i) => {
                  const v = dataMap[predKey][fn.toLowerCase()];
                  const value = round(v, 5);
                  return (
                    <span
                      key={predKey}
                      className={
                        i
                          ? undefined
                          : Config.Css.css({ display: "flex", justifyContent: "space-between", width: "100%" })
                      }
                    >
                      {!i && <span>{fn}</span>}
                      <span
                        title={`Zkopírovat ${v}`}
                        onClick={() => Utils.Clipboard.write(v + "")}
                        className={Config.Css.css({ cursor: "copy" })}
                      >
                        {value}
                      </span>
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </Uu5Elements.Grid>
        </Uu5Elements.Grid>

        <Uu5Elements.Block headerType="heading" header={dataModel.formula}>
          <XyChart
            data={displayedData}
            series={series}
            labelAxis={{ dataKey: xAxes, title: xAxes }}
            valueAxis={{ title: yAxes }}
            legend
          />

          {isTwoCharts && predData && (
            <XyChart
              data={predData}
              series={predSeries}
              labelAxis={{ dataKey: xAxes, title: xAxes }}
              valueAxis={{ title: yAxes }}
              legend
            />
          )}
        </Uu5Elements.Block>
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataPrediction };
export default DataPrediction;
