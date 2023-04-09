//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, PropTypes, useEffect, useState, useUpdateEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import Data, { OUTLIERS_ALPHA } from "../model/data";
import Histogram from "../charts/histogram";
import Card from "./card";
import List from "./list";
import withControlledInput from "./with-controlled-input";
import withData from "./with-data";

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

const NumberInput = withControlledInput(Uu5Forms.Number);

const DataAnalysis = withData(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "DataAnalysing",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.instanceOf(Data).isRequired,
      onDataChange: PropTypes.func,
      alpha: PropTypes.number,
      max: PropTypes.number,
      onAlphaChange: PropTypes.func,
      onMaxChange: PropTypes.func,
      removeOutliers: PropTypes.bool,
      onRemoveOutliersChange: PropTypes.func,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const {
        data: propsData,
        onDataChange,
        alpha = OUTLIERS_ALPHA,
        max,
        onAlphaChange,
        onMaxChange,
        removeOutliers = true,
        onRemoveOutliersChange,
        ...blockProps
      } = props;

      const [data, setData] = useState(() => prepareData(propsData, { alpha, max }));

      const cleanData = data.filter(({ _outlier }) => !_outlier);

      useEffect(() => {
        removeOutliers && onDataChange?.(new Data(cleanData));
      }, [data, alpha, max]);

      useUpdateEffect(() => {
        setData(prepareData(propsData, { alpha, max }));
      }, [propsData, alpha, max]);

      // TODO format by user preferences
      const outliersLimitToDisplay = Math.round(data.outliersLimit * 100) / 100;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Uu5Elements.Block headerType="heading" header="Mahalanobis" level={2} {...blockProps}>
          {onAlphaChange && onMaxChange && (
            <Uu5Elements.Grid templateColumns={{ xs: "1fr", s: "1fr 1fr" }} columnGap={16} rowGap={16}>
              <NumberInput
                name="alpha"
                label={{ cs: "Hladina významnosti" }}
                min={0}
                max={1}
                step={0.01}
                value={alpha}
                onBlur={(e) => {
                  onAlphaChange && onAlphaChange(e.data.value);
                  setData(prepareData(data, { alpha: e.data.value, max }));
                }}
                disabled={max != null}
                info={{
                  cs: "Dle zadané hladiny významnosti se vypočítá odpovídající hodnota chí-kvadrát rozdělení pro tolik stupňů volnosti, kolik je kvantitativních proměnných. Tato hodnota slouží jako hranice pro odlehlá pozorování.",
                }}
              />
              <NumberInput
                name="max"
                label={{ cs: "Hranice odlehlosti" }}
                value={max}
                onBlur={(e) => {
                  onMaxChange && onMaxChange(e.data.value);
                  setData(prepareData(data, { alpha, max: e.data.value }));
                }}
                info={{
                  cs: "Maximální vzdálenost, které mohou položky dosáhnout, aby nešlo o odlehlá pozorování.",
                }}
              />
            </Uu5Elements.Grid>
          )}

          <Uu5Elements.Grid
            className={Config.Css.css({ padding: 16 })}
            columnGap={16}
            rowGap={16}
            templateColumns="repeat(auto-fit, 144px)"
          >
            <Card header="Všechna data" value={data.length} />
            <Card header="Očištěná data" value={cleanData.length} valueColorScheme="positive" />
            <OutliersCard
              header="Odlehlá data"
              value={data.length - cleanData.length}
              valueColorScheme="red"
              data={data.filter((it) => it._outlier)}
            />
          </Uu5Elements.Grid>

          <Uu5Elements.Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))">
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

          {onRemoveOutliersChange && (
            <Uu5Forms.Checkbox
              name="removeOutliers"
              label={{ cs: "Odebrat odlehlá pozorování" }}
              value={removeOutliers}
              onChange={(e) => onRemoveOutliersChange(e.data.value)}
            />
          )}
        </Uu5Elements.Block>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { DataAnalysis };
export default DataAnalysis;
