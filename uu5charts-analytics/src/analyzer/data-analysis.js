//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, useEffect, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import Data, { OUTLIERS_ALPHA } from "../model/data";
import Histogram from "../charts/histogram";
import Card from "./card";
import List from "./list";

//@@viewOff:imports

function prepareData(data, opts) {
  data.selectOutliers(opts);
  return data;
}

function OutliersCard(props) {
  const { data, ...cardProps } = props;
  const [outliersOpen, setOutliersOpen] = useState(false);

  return (
    <>
      <Card {...cardProps} onClick={() => setOutliersOpen(true)} />
      <Uu5Elements.Modal width="100%" open={outliersOpen} onClose={() => setOutliersOpen(false)}>
        <List data={data} tileMinWidth={300} tileMaxWidth={350} />
      </Uu5Elements.Modal>
    </>
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
    const { mahalAlpha: alpha, mahalMax: max, removeOutliers } = value;

    const [data, setData] = useState(() => prepareData(value.data, { alpha, max }));

    const cleanData = data.filter(({ _outlier }) => !_outlier);

    // unmount is later than mount of next component
    useEffect(() => {
      setItemValue("cleanData", removeOutliers ? new Data(cleanData) : value.data);
    }, [data, value.data, removeOutliers, setItemValue]);

    // TODO format by user preferences
    const outliersLimitToDisplay = Math.round(data.outliersLimit * 100) / 100;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="heading" header="Mahalanobis" level={2} {...props}>
        <Uu5Elements.Grid templateColumns={{ xs: "1fr", s: "1fr 1fr" }} columnGap={16} rowGap={16}>
          <Uu5Forms.FormNumber
            name="mahalAlpha"
            label={{ cs: "Hladina významnosti" }}
            initialValue={OUTLIERS_ALPHA}
            min={0}
            max={1}
            step={0.01}
            onBlur={() => setData(prepareData(data, { alpha, max }))}
            disabled={max != null}
            info={{
              cs: "Dle zadané hladiny významnosti se vypočítá odpovídající hodnota chí-kvadrát rozdělení pro tolik stupňů volnosti, kolik je kvantitativních proměnných. Tato hodnota slouží jako hranice pro odlehlá pozorování.",
            }}
          />
          <Uu5Forms.FormNumber
            name="mahalMax"
            label={{ cs: "Hranice odlehlosti" }}
            onBlur={() => setData(prepareData(data, { alpha, max }))}
            info={{
              cs: "Maximální vzdálenost, které mohou položky dosáhnout, aby nešlo o odlehlá pozorování.",
            }}
          />
        </Uu5Elements.Grid>

        <div className={Config.Css.css({ display: "flex", gap: 16, padding: 16 })}>
          <Card header="Všechna data" value={data.length} />
          <Card header="Očištěná data" value={cleanData.length} valueColorScheme="positive" />
          <OutliersCard
            header="Odlehlá data"
            value={data.length - cleanData.length}
            valueColorScheme="red"
            data={data.filter((it) => it._outlier)}
          />
        </div>

        <Uu5Elements.Grid templateColumns="repeat(auto-fit, minmax(450px, 1fr))">
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

          <Histogram
            data={data}
            valueAxis={{ dataKey: "_distance" }}
            labelAxis={{ title: "Vzdálenosti" }}
            binSize={20}
            lines={[{ color: "red", x: data.outliersLimit, title: `Hranice odlehlosti ${outliersLimitToDisplay}` }]}
          />
        </Uu5Elements.Grid>

        <Uu5Forms.FormCheckbox name="removeOutliers" label={{ cs: "Odebrat odlehlá pozorování" }} initialValue={true} />
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataAnalysis };
export default DataAnalysis;
