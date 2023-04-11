//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, PropTypes, useEffect, useState, useValueChange } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import { round } from "../model/tools";
import Regression from "../model/regression";
import withData from "./with-data";
import Data from "../model/data";
//@@viewOff:imports

const regTypeKeys = Object.keys(Config.REG_TYPE_MAP);

const DataRegression = withData(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "DataRegression",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.instanceOf(Data).isRequired,
      xAxes: PropTypes.string,
      yAxes: PropTypes.string,
      type: PropTypes.oneOf(regTypeKeys),
      onXAxesChange: PropTypes.func,
      onYAxesChange: PropTypes.func,
      onTypeChange: PropTypes.func,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { data, xAxes, yAxes, onXAxesChange, onYAxesChange, type: propsType, onTypeChange, ...blockProps } = props;
      const quantitativeKeys = data.getQuantitativeKeys();

      const isTypeChange = !!onTypeChange;

      const [regList, setRegList] = useState();
      const [type, setType] = useValueChange(propsType, onTypeChange);

      const realType = type ?? regList?.[0]?.name;
      const reg = regList?.find(({ name }) => name === realType);

      const isWholeList = !propsType || !!isTypeChange;

      useEffect(() => {
        if (xAxes && yAxes && isWholeList) {
          const regs = regTypeKeys.map((name) => Regression[name](data, xAxes, yAxes)).sort((a, b) => a.aic - b.aic);
          setRegList(regs);
          // console.log(regs);
        }
      }, [data, xAxes, yAxes, isWholeList]);

      useEffect(() => {
        if (xAxes && yAxes && !isWholeList) {
          const regs = [propsType].map((name) => Regression[name](data, xAxes, yAxes)).sort((a, b) => a.aic - b.aic);
          setRegList(regs);
        }
      }, [data, xAxes, yAxes, isWholeList, propsType]);

      // to set type if it was not received in props
      useEffect(() => {
        if (realType && realType !== propsType && onTypeChange) onTypeChange(realType);
      }, [realType, propsType, onTypeChange]);
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Uu5Elements.Block headerType="heading" header="Regrese" level={2} {...blockProps}>
          {onXAxesChange && onYAxesChange && (
            <Uu5Elements.Grid templateColumns={{ xs: "1fr", m: "1fr 1fr" }} columnGap={16} rowGap={16}>
              <Uu5Forms.Select
                name="xAxes"
                label={{ cs: "Data x" }}
                required
                itemList={quantitativeKeys.filter((k) => k !== yAxes).map((k) => ({ value: k }))}
                info={{
                  cs: "Vysvětlující nezávislá proměnná",
                }}
                value={xAxes}
                onChange={(e) => onXAxesChange(e.data.value)}
              />
              <Uu5Forms.Select
                name="yAxes"
                label={{ cs: "Data y" }}
                required
                itemList={quantitativeKeys.filter((k) => k !== xAxes).map((k) => ({ value: k }))}
                info={{
                  cs: "Vysvětlovaná závislá proměnná",
                }}
                value={yAxes}
                onChange={(e) => onYAxesChange(e.data.value)}
              />
            </Uu5Elements.Grid>
          )}

          {regList?.length > 0 && (
            <Uu5Forms.Select
              name="regressionType"
              label={{ cs: "Typ regrese" }}
              value={realType}
              onChange={(e) => setType(e.data.value)}
              itemList={regList.map(({ name, formula, r2Adj }) => ({
                value: name,
                children: `${Config.REG_TYPE_MAP[name]} (${round(r2Adj * 100, 0)}%): ${formula}`,
              }))}
            />
          )}

          {reg && (
            <Uu5Elements.Grid templateColumns={{ xs: "1fr", l: "1fr 1fr" }} columnGap={16} rowGap={16}>
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
                    line: { strokeWidth: 5, type: "monotone" },
                    title: Config.REG_TYPE_MAP[reg.name] + " regrese",
                  },
                ]}
                labelAxis={{ dataKey: xAxes, title: xAxes }}
                valueAxis={{ title: yAxes }}
                legend
              />
              <XyChart
                data={data.map((it, i) => ({ ...it, _residuals: reg.residuals[i], _i: i }))}
                series={[{ valueKey: "_residuals", title: "Residua" }]}
                labelAxis={{ dataKey: "_i", title: "Pořadí" }}
                valueAxis={{ title: "Vzdálenost" }}
                legend
              />
            </Uu5Elements.Grid>
          )}
        </Uu5Elements.Block>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { DataRegression };
export default DataRegression;
