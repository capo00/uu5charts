//@@viewOn:imports
import regression from "regression";
import { XyChart } from "uu5charts";
import jStat from "jstat";
import { createVisualComponent, useCallback, useEffect, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";

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
      (x, y) => {
        // var A = [
        //   [2],
        //   [1],
        //   [-2],
        //   [3],
        //   [-10],
        //   [4],
        //   [10],
        //   [3],
        //   [4]
        // ];
        // var b = [1, -2, 3, 4, -5, 6, 7, -8, 9];
        // var model1 = jStat.models.ols(b, A);
        // console.log(model1)
        //
        // const X = [];
        // const Y = [];
        //
        // data.forEach((it) => {
        //   X.push([it[xAxes]]);
        //   Y.push(it[yAxes]);
        // });
        // console.log("x, y", X, Y);
        //
        //
        // const model = jStat.models.ols(Y, X);
        // console.log(model);

        const regData = data.map((it) => [it[x], it[y]]);
        const regressions = ["linear", "exponential", "logarithmic", "power", "polynomial"]
          .map((name) => {
            const reg = regression[name](regData);
            reg.name = name;
            return reg;
          })
          .sort((a, b) => b.r2 - a.r2);

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

        {regList && (
          <Uu5Forms.FormSelect
            name="regressionType"
            label={{ cs: "Typ regrese" }}
            initialValue={reg.name}
            onChange={(e) => setReg(regList.find(({ name }) => name === e.data.value))}
            itemList={regList.map(({ name, string, r2 }) => ({ value: name, children: `${name} (${r2}): ${string}` }))}
          />
        )}

        {regList && (
          <XyChart
            data={data.map((it, i) => ({ ...it, _regression: reg.points[i][1] }))}
            series={[
              { valueKey: yAxes },
              { valueKey: "_regression", color: "red", line: { strokeWidth: 5 }, title: "Regrese" },
            ]}
            labelAxis={{ dataKey: xAxes, title: xAxes }}
            valueAxis={{ title: yAxes }}
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
