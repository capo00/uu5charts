//@@viewOn:imports
import { ResponsiveContainer, Pie, PieChart as RechartsPieChart, Cell, LabelList, Label } from "recharts";
import { createVisualComponent, PropTypes, useState } from "uu5g05";
import Config from "../config/config.js";
import Tooltip from "./tooltip";
import Legend from "./legend";
import Color from "./color";

//@@viewOff:imports

function useInteractiveLegend(data) {
  const flatData = data.flat();

  const [visibility, _setVisibility] = useState(() => {
    return flatData.reduce((map, data, i) => {
      map.set(data, true);
      return map;
    }, new Map());
  });

  function setVisibility(key) {
    _setVisibility((map) => {
      map.set(key, !map.get(key));
      return new Map(map);
    });
  }

  const [hover, setHover] = useState();

  return [
    visibility,
    hover,
    {
      onClick: (e) => {
        //console.log(e);
        const item = e.payload.payload.payload;
        setVisibility(item);
        setHover(visibility.get(item) ? null : item);
      },
      onMouseEnter: (e) => visibility.get(e.payload.payload.payload) && setHover(e.payload.payload.payload),
      onMouseLeave: () => setHover(null),
    },
  ];
}

const PieChart = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PieChart",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object])).isRequired,
    series: PropTypes.arrayOf(
      PropTypes.shape({
        valueKey: PropTypes.string.isRequired,
        labelKey: PropTypes.string,
        color: PropTypes.func,
        onClick: PropTypes.func,
        label: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
        innerRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        outerRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        startAngle: PropTypes.number,
        endAngle: PropTypes.number,
        gap: PropTypes.number,
        children: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ).isRequired,

    legend: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.shape({
        title: PropTypes.node,
        position: PropTypes.oneOf([
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-center",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ]),
        layout: PropTypes.oneOf(["horizontal", "vertical"]),
        children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
      }),
    ]),
    tooltip: PropTypes.oneOfType([PropTypes.bool, PropTypes.element, PropTypes.func]),

    height: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    data: [],
    series: [],
    tooltip: true,
    height: 300,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data: propsData, series, legend, tooltip, height } = props;
    const dataArr = Array.isArray(propsData[0]) ? propsData : [propsData];

    // TODO hiding of pie sectors does not work
    const [visibilityMap, hoverData, legendAttrs] = useInteractiveLegend(dataArr);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            {series.map((serie, i) => {
              let {
                id = "id-" + i,
                valueKey,
                labelKey,
                color,
                onClick,
                label = true,
                innerRadius,
                outerRadius = "95%",
                startAngle = 0,
                endAngle = startAngle + 360,
                gap: paddingAngle,
                children,
              } = serie;

              let componentProps = {
                onClick,
                id,
                innerRadius,
                outerRadius,
                startAngle: 90 - startAngle,
                endAngle: 90 - endAngle,
                paddingAngle,
              };

              if (label === true) label = {};

              const data = dataArr[i];
              const currentColors = Color.generateColors(data.length, i % 2 !== 0);

              return (
                <Pie data={data} {...componentProps} key={valueKey + "-" + i} dataKey={valueKey} nameKey={labelKey}>
                  {data.map((item, i) => {
                    const fill = Color.getColor(
                      color ? (typeof color === "function" ? color(item) : item[color] || color) : undefined,
                      currentColors
                    );

                    const opacity = hoverData === item ? 0.4 : undefined;

                    return <Cell key={i} fill={fill} opacity={opacity} />;
                  })}
                  {label && <LabelList position="inside" {...label} dataKey={label.dataKey ?? valueKey} />}
                  {children && <Label position="center" value={children} />}
                </Pie>
              );
            })}

            {tooltip && Tooltip({ children: tooltip === true ? undefined : tooltip })}
            {legend && Legend({ ...(legend === true ? null : legend), ...legendAttrs })}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { PieChart };
export default PieChart;
