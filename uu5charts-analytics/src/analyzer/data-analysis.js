//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createComponent, createVisualComponent, useEffect, useState, useUpdateEffect, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import Data, { OUTLIERS_ALPHA } from "../model/data";
import Histogram from "../charts/histogram";

//@@viewOff:imports

function prepareData(data, opts) {
  data.selectOutliers(opts);
  return data;
}

function Card(props) {
  const { header, value } = props;

  return (
    <Uu5Elements.Box
      aspectRatio="1x1"
      size="s"
      borderRadius="moderate"
      className={Config.Css.css({
        display: "inline-flex",
        gap: 16,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Uu5Elements.Text category="interface" segment="title" type="minor" colorScheme="dim" significance="subdued">
        {header}
      </Uu5Elements.Text>
      <Uu5Elements.Text category="interface" segment="title" type="main" colorScheme="building">
        {value}
      </Uu5Elements.Text>
    </Uu5Elements.Box>
  );
}

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
    const { value, setItemValue } = useFormApi();
    const { mahalAlpha: alpha, mahalMax: max } = value;

    const [activeCode, setActiveCode] = useState("distance");

    const [data, setData] = useState(() => prepareData(value.data, { alpha, max }));

    const cleanData = data.filter(({ _outlier }) => !_outlier);

    // unmount is later than mount of next component
    useEffect(() => () => setItemValue("cleanData", new Data(cleanData), []));

    // TODO format by user preferences
    const outliersLimitToDisplay = Math.round(data.outliersLimit * 100) / 100;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div>
        <Uu5Elements.Block headerType="title" header="Mahalanobis">
          <Uu5Forms.FormNumber
            name="mahalAlpha"
            label={{ cs: "Hladina významnosti" }}
            initialValue={OUTLIERS_ALPHA}
            min={0}
            max={1}
            step={0.0001}
            onBlur={() => setData(prepareData(data, { alpha, max }))}
            disabled={max != null}
          />
          <Uu5Forms.FormNumber
            name="mahalMax"
            label={{ cs: "Maximální hodnota" }}
            onBlur={() => setData(prepareData(data, { alpha, max }))}
          />

          <Uu5Elements.Tabs
            itemList={[
              { label: "Vzdálenost", code: "distance" },
              { label: "Histogram", code: "histogram" },
            ]}
            activeCode={activeCode}
            onChange={(e) => setActiveCode(e.data.activeCode)}
          />
          {activeCode === "distance" ? (
            <>
              <div className={Config.Css.css({ display: "flex", gap: 16, padding: 16 })}>
                <Card header="Všechna data" value={data.length} />
                <Card header="Očištěná data" value={cleanData.length} />
                <Card header="Odlehlá data" value={data.length - cleanData.length} />
              </div>
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
            </>
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
