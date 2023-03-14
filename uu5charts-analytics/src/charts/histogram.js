//@@viewOn:imports
import { XyChart } from "uu5charts";
import { createVisualComponent, PropTypes, useState, useUpdateEffect } from "uu5g05";
import Config from "../config/config.js";
import Data from "../model/data";

//@@viewOff:imports

function getHistData(data, dataKey, binSize) {
  const dataModel = (data instanceof Data ? data : new Data(data)).getHistogram(dataKey, binSize);
  return {
    data: dataModel,
    ticks: dataModel.map((item) => item.max).filter((it) => !!it),
  };
}

const Histogram = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Histogram",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    binSize: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    binSize: 10,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data, labelAxis, binSize, ...propsToPass } = props;
    const { dataKey, ...valueAxis } = props.valueAxis;

    const [histData, setHistData] = useState(() => getHistData(data, dataKey, binSize));

    useUpdateEffect(() => {
      setHistData(getHistData(data, dataKey, binSize));
    }, [data, dataKey, binSize]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <XyChart
        {...propsToPass}
        data={histData.data}
        series={[{ valueKey: "value", bar: true }]}
        valueAxis={{ title: "Počet", ...valueAxis }}
        labelAxis={{
          ...labelAxis,
          title: "Rozsah",
          dataKey: "label",
          ticks: histData.ticks,
        }}
        barGap={0}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Histogram };
export default Histogram;
