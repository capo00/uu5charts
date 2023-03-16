//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, useCallback, useEffect, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import { round } from "../model/tools";
import Regression from "../model/regression";

//@@viewOff:imports

const DataRegression = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataRegression",
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
    const { cleanData: data, xAxes, yAxes, quantitativeKeys = data.getQuantitativeKeys() } = value;

    const [reg, setReg] = useState();
    const [regList, setRegList] = useState();

    const setRegression = useCallback(
      (xAxes, yAxes) => {
        const regressions = ["linear", "exponential", "logarithmic", "power", "polynomial"]
          .map((name) => {
            return Regression[name](data, xAxes, yAxes);
          })
          .sort((a, b) => b.r2Adj - a.r2Adj);

        console.log(regressions);

        setRegList(regressions);
        setReg(regressions[0]);
      },
      [data, setReg, setRegList]
    );

    useEffect(() => {
      if (!reg && xAxes && yAxes) {
        setRegression(xAxes, yAxes);
      }
    }, [reg, setRegression, xAxes, yAxes]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="heading" header="Regrese" level={2} {...props}>
        <div className={Config.Css.css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 })}>
          <Uu5Forms.FormSelect
            name="xAxes"
            label={{ cs: "Data x" }}
            required
            onChange={(e) => {
              if (e.data.value && yAxes) setRegression(e.data.value, yAxes);
            }}
            itemList={quantitativeKeys.filter((k) => k !== yAxes).map((k) => ({ value: k }))}
          />
          <Uu5Forms.FormSelect
            name="yAxes"
            label={{ cs: "Data y" }}
            required
            onChange={(e) => {
              if (e.data.value && xAxes) setRegression(xAxes, e.data.value);
            }}
            itemList={quantitativeKeys.filter((k) => k !== xAxes).map((k) => ({ value: k }))}
          />
        </div>

        {regList && (
          <Uu5Forms.FormSelect
            name="regressionType"
            label={{ cs: "Typ regrese" }}
            initialValue={reg.name}
            onChange={(e) => setReg(regList.find(({ name }) => name === e.data.value))}
            itemList={regList.map(({ name, formula, r2Adj }) => ({
              value: name,
              children: `${name} (${round(r2Adj)}): ${formula}`,
            }))}
          />
        )}

        {regList && (
          <XyChart
            data={data.map((it, i) => ({
              ...it,
              _regression: reg.points[i],
              _regressionMin: reg.predictMin(it[xAxes]),
              _regressionMax: reg.predictMax(it[xAxes]),
            }))}
            series={[
              { valueKey: yAxes },
              { valueKey: "_regression", color: "red", line: { strokeWidth: 5 }, title: "Regrese" },
              { valueKey: "_regressionMin", color: "orange", line: { strokeWidth: 1 }, title: "Regrese min" },
              { valueKey: "_regressionMax", color: "orange", line: { strokeWidth: 1 }, title: "Regrese max" },
            ]}
            labelAxis={{ dataKey: xAxes, title: xAxes }}
            valueAxis={{ title: yAxes }}
          />
        )}

        {regList && (
          <XyChart
            data={data.map((it, i) => ({ ...it, _residuals: reg.residuals[i], _i: i }))}
            series={[{ valueKey: "_residuals" }]}
            labelAxis={{ dataKey: "_i", title: "Pořadí" }}
            valueAxis={{ title: "Residua" }}
          />
        )}
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataRegression };
export default DataRegression;
