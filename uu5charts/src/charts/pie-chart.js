//@@viewOn:imports
import { ResponsiveContainer, Pie, PieChart as RechartsPieChart, Cell, Label } from "recharts";
import { createComponent, createVisualComponent, PropTypes, useState } from "uu5g05";
import Config from "../config/config.js";
import Tooltip from "./tooltip";
import Legend from "./legend";
import DefaultLabel from "./label";
import Color from "./color";

//@@viewOff:imports

function withDataCorrector(Component) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withDataCorrector(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array])).isRequired,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      data: [],
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let { data, series = [], ...restProps } = props;

      const firstItem = data[0];
      let itemKeys;

      if (typeof firstItem === "number") {
        // array of numbers

        data = data.map((v, i) => ({ label: i, value: v }));
        series[0] ||= {};
        series[0].labelKey = "label";
        series[0].valueKey = "value";
      } else if (Array.isArray(firstItem) && firstItem[0] != null && typeof firstItem[0] !== "object") {
        // array of arrays

        data = data.map((arr) => Object.fromEntries(arr.map((v, i) => [i, v])));
        series[0] ||= {};
        series[0].labelKey ??= 0;
        series[0].valueKey ??= 1;
      }

      // array of objects

      if (series.length === 0) {
        let firstNumberKeys = [];
        let firstStringKey;
        itemKeys ??= Object.keys(firstItem);
        const seriesKeys = series.map(({ valueKey }) => valueKey);

        for (let i = 0; i < itemKeys.length && (!firstStringKey || firstNumberKeys.length === 0); i++) {
          const k = itemKeys[i];
          if (!seriesKeys.includes(k)) {
            if (typeof firstItem[k] === "string") {
              const keyValues = data.map(({ [k]: v }) => v);
              // find unique values
              if (new Set(keyValues).size === keyValues.length) {
                firstStringKey = k;
              } else if (!firstStringKey) firstStringKey = k;
            } else if (typeof firstItem[k] === "number" && firstNumberKeys.length < 2) {
              firstNumberKeys.push(k);
            }
          }
        }

        series.push({ labelKey: firstStringKey ?? firstNumberKeys.shift(), valueKey: firstNumberKeys[0] });
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <Component {...restProps} data={data} series={series} />;
      //@@viewOff:render
    },
  });
}

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

const PieChart = withDataCorrector(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "PieChart",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object])).isRequired,
      series: PropTypes.arrayOf(
        PropTypes.shape({
          valueKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          labelKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          color: PropTypes.func,
          onClick: PropTypes.func,
          label: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
          unit: PropTypes.string,
          innerRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          outerRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          startAngle: PropTypes.number,
          endAngle: PropTypes.number,
          gap: PropTypes.number,
          children: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
      ),

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

      width: PropTypes.unit,
      height: PropTypes.unit,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      data: [],
      series: [],
      tooltip: true,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { data: propsData, series, legend, tooltip, width = "100%", height } = props;
      const dataArr = Array.isArray(propsData[0]) ? propsData : [propsData];

      // TODO hiding of pie sectors does not work
      const [visibilityMap, hoverData, legendAttrs] = useInteractiveLegend(dataArr);
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <ResponsiveContainer aspect={!width || !height ? 1 / 1 : undefined} width={width} height={height} minWidth={0}>
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
                outerRadius = "100%",
                startAngle = 0,
                endAngle = startAngle + 360,
                gap: paddingAngle,
                children,
              } = serie;

              if (series.length > 1 && !innerRadius && !serie.outerRadius) {
                // first has 2/n and rest have only 1/n;
                const part = 100 / (series.length + 1);
                innerRadius = Math.round((i ? i + 1 : i) * part) + "%";
                outerRadius = Math.round((i + 2) * part) + "%";
              }

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
                  {label && DefaultLabel({ dataKey: valueKey, position: "inside", ...label })}
                  {children && <Label position="center" value={children} />}
                </Pie>
              );
            })}

            {tooltip && Tooltip({ children: tooltip === true ? undefined : tooltip })}
            {legend && Legend({ ...(legend === true ? null : legend), ...legendAttrs })}
          </RechartsPieChart>
        </ResponsiveContainer>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { PieChart };
export default PieChart;
