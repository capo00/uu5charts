//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, useCallback, useEffect, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import { round } from "../model/tools";
import Regression from "../model/regression";

const regTypeKeys = Object.keys(Config.REG_TYPE_MAP);

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
        const regressions = regTypeKeys
          .map((name) => {
            return Regression[name](data, xAxes, yAxes);
          })
          .sort((a, b) => a.aic + a.bic - (b.aic + b.bic));

        console.log(regressions);

        // const R = {
        //   power: {
        //     aic: -255.2237,
        //     bic: -243.467,
        //   },
        //   polynomial: {
        //     aic: 3200.269,
        //     bic: 3215.944,
        //   },
        //   logarithmic: {
        //     aic: 3236.157,
        //     bic: 3247.914,
        //   },
        //   exponential: {
        //     aic: -199.0434,
        //     bic: -187.2867,
        //   },
        //   linear: {
        //     aic: 3314.565,
        //     bic: 3326.322,
        //   },
        // };
        //
        // const tableAic = [];
        // regressions.forEach((reg) =>
        //   tableAic.push({
        //     name: reg.name,
        //     aic: reg.aic,
        //     aicR: R[reg.name].aic,
        //   })
        // );
        // console.table(tableAic);
        //
        // const tableBic = [];
        // regressions.forEach((reg) =>
        //   tableBic.push({
        //     name: reg.name,
        //     bic: reg.bic,
        //     bicR: R[reg.name].bic,
        //   })
        // );
        // console.table(tableBic);

        setRegList(regressions);
        setReg(regressions[0]);
      },
      [data]
    );

    useEffect(() => {
      if (xAxes && yAxes) {
        setRegression(xAxes, yAxes);
      }
    }, [setRegression, xAxes, yAxes]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="heading" header="Regrese" level={2} {...props}>
        <Uu5Elements.Grid templateColumns={{ xs: "1fr", m: "1fr 1fr" }} columnGap={16} rowGap={16}>
          <Uu5Forms.FormSelect
            name="xAxes"
            label={{ cs: "Data x" }}
            required
            itemList={quantitativeKeys.filter((k) => k !== yAxes).map((k) => ({ value: k }))}
          />
          <Uu5Forms.FormSelect
            name="yAxes"
            label={{ cs: "Data y" }}
            required
            itemList={quantitativeKeys.filter((k) => k !== xAxes).map((k) => ({ value: k }))}
          />
        </Uu5Elements.Grid>

        {regList && (
          <Uu5Forms.FormSelect
            name="regressionType"
            label={{ cs: "Typ regrese" }}
            initialValue={reg.name}
            onChange={(e) => setReg(regList.find(({ name }) => name === e.data.value))}
            itemList={regList.map(({ name, formula, r2Adj }) => ({
              value: name,
              children: `${Config.REG_TYPE_MAP[name]} (${round(r2Adj * 100, 0)}%): ${formula}`,
            }))}
          />
        )}

        {regList && (
          <XyChart
            data={data.map((it, i) => ({
              ...it,
              _regression: reg.points[i],
            }))}
            series={[
              { valueKey: yAxes },
              {
                valueKey: "_regression",
                color: "purple",
                line: { strokeWidth: 5 },
                title: Config.REG_TYPE_MAP[reg.name] + " regrese",
              },
            ]}
            labelAxis={{ dataKey: xAxes, title: xAxes }}
            valueAxis={{ title: yAxes }}
            legend
          />
        )}

        {regList && (
          <XyChart
            data={data.map((it, i) => ({ ...it, _residuals: reg.residuals[i], _i: i }))}
            series={[{ valueKey: "_residuals", title: "Residua" }]}
            labelAxis={{ dataKey: "_i", title: "Pořadí" }}
            valueAxis={{ title: "Vzdálenost" }}
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
