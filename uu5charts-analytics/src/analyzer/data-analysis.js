//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createComponent, createVisualComponent, useState, useUpdateEffect, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import Data, { OUTLIERS_ALPHA } from "../model/data";
import Histogram from "../charts/histogram";

//@@viewOff:imports

function prepareData(data, opts) {
  data.removeOutliers(opts);
  return data;
}

function withControlledInput(Component) {
  return createComponent({
    uu5Tag: `withControlledInput(${Component.uu5Tag || "noname"})`,

    render({ onChange, onBlur, ...props }) {
      const [value, setValue] = useState(props.value);

      return (
        <Component
          {...props}
          value={value}
          onChange={(e) => {
            setValue(e.data.value);
            typeof onChange === "function" && onChange(e);
          }}
          onBlur={(e) => typeof onBlur === "function" && onBlur(new Utils.Event({ ...e.data, value }, e))}
        />
      );
    },
  });
}

const ControlledNumber = withControlledInput(Uu5Forms.Number);

const DataAnalysis = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataAnalysing",
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

    const [activeCode, setActiveCode] = useState("distance");
    const [alpha, setAlpha] = useState(OUTLIERS_ALPHA);
    const [max, setMax] = useState();

    const [data, setData] = useState(() => prepareData(value.data));

    useUpdateEffect(() => {
      setData(prepareData(new Data(value.data), { alpha, max }));
    }, [value.data, alpha, max]);

    // TODO format by user preferences
    const outliersLimitToDisplay = Math.round(data.outliersLimit * 100) / 100;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div>
        <Uu5Elements.Block headerType="title" header="Mahalanobis">
          <ControlledNumber
            label={{ cs: "Hladina významnosti" }}
            value={alpha}
            min={0}
            max={1}
            step={0.0001}
            onBlur={(e) => setAlpha(e.data.value)}
            disabled={max != null}
          />
          <ControlledNumber label={{ cs: "Maximální hodnota" }} value={max} onBlur={(e) => setMax(e.data.value)} />

          <Uu5Elements.Tabs
            itemList={[
              { label: "Vzdálenost", code: "distance" },
              { label: "Histogram", code: "histogram" },
              // { label: "Cumulative", code: "cumulative" },
            ]}
            activeCode={activeCode}
            onChange={(e) => setActiveCode(e.data.activeCode)}
          />
          {activeCode === "distance" ? (
            <XyChart
              data={data.map(({ _distance, _outlier, _outlier2, ...item }) => ({
                ...item,
                [_outlier ? "_outlier" : "_distance"]: _distance,
              }))}
              series={[{ valueKey: "_distance" }, { valueKey: "_outlier", color: "red" }]}
              labelAxis={{ dataKey: "Name" }}
              valueAxis={{ title: "Vzdálenost" }}
              lines={[{ color: "red", y: data.outliersLimit, title: `Hranice odlehlosti ${outliersLimitToDisplay}` }]}
            />
          ) : (
            <Histogram
              data={data}
              valueAxis={{ dataKey: "_distance" }}
              binSize={20}
              lines={[{ color: "red", x: data.outliersLimit, title: `Hranice odlehlosti ${outliersLimitToDisplay}` }]}
            />
          )}
        </Uu5Elements.Block>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataAnalysis };
export default DataAnalysis;
