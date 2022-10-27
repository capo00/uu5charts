//@@viewOn:imports
import {
  ComposedChart,
  CartesianGrid,
  Legend,
  Scatter,
  Line,
  Area,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Label,
  ScatterChart,
  LineChart,
  AreaChart,
  BarChart,
} from "recharts";
import { createComponent, createVisualComponent, PropTypes, useState } from "uu5g05";
import { UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

const gdsColors = UuGds.getValue(["ColorPalette", "basic"]);

function generateColors(length) {
  const colors = [];

  for (let color of ["blue", "purple"]) {
    for (let key of ["mainDarkest", "mainDarker", "main", "mainLighter", "mainLightest"]) {
      colors.push(gdsColors[color][key]);
      if (colors.length >= length) break;
    }
    if (colors.length >= length) break;
  }

  return colors;
}

function getColor(color, colorList) {
  return (color ? gdsColors[color]?.main : null) || colorList.shift();
}

function withDataCorrector(Component) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withDataCorrector(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])).isRequired,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let { data, series = [], labelAxis = {}, ...restProps } = props;

      if (typeof data[0] === "number") {
        data = data.map((v, i) => ({ label: i, value: v }));
        labelAxis.dataKey = "label";
        series[0] ||= {};
        series[0].valueKey = "value";
      } else if (Array.isArray(data[0])) {
        data = data.map((arr) => Object.fromEntries(arr.map((v, i) => [i, v])));
        labelAxis.dataKey ??= 0;
        series[0] ||= {};
        series[0].valueKey ??= 1;
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <Component {...restProps} data={data} series={series} labelAxis={labelAxis} />;
      //@@viewOff:render
    },
  });
}

const COMPONENTS = {
  point: ScatterChart,
  line: LineChart,
  area: AreaChart,
  bar: BarChart,
};

const XyChart = withDataCorrector(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "XyChart",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.arrayOf(PropTypes.object).isRequired,
      series: PropTypes.arrayOf(
        PropTypes.shape({
          valueKey: PropTypes.string.isRequired,
          title: PropTypes.node,
          color: PropTypes.string,
          onClick: PropTypes.func,

          point: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({})]),
          line: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.shape({
              point: PropTypes.bool,
              type: PropTypes.oneOf(["basis", "linear", "natural", "monotoneX", "monotoneY", "monotone", "step", "stepBefore", "stepAfter"]),
              label: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
              width: PropTypes.number,
            }),
          ]),
          area: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({})]),
          bar: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({})]),
          //labelKey: PropTypes.string, // for Pie and Radar
        })
      ).isRequired,

      labelAxis: PropTypes.shape({
        dataKey: PropTypes.string.isRequired,
        title: PropTypes.string,
        unit: PropTypes.string,
      }).isRequired,
      valueAxis: PropTypes.shape({
        title: PropTypes.string,
        unit: PropTypes.string,
      }),

      legend: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.shape({
          title: PropTypes.string,
          position: PropTypes.oneOf([
            "top-left", "top-center", "top-right",
            "middle-left", "middle-center", "middle-right",
            "bottom-left", "bottom-center", "bottom-right",
          ]),
          component: PropTypes.func,
        }),
      ]),
      tooltip: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
      label: PropTypes.shape({
        position: PropTypes.oneOf(["top", "center", "bottom"]),
        component: PropTypes.func,
      }),

      displayCartesianGrid: PropTypes.bool,
      onClick: PropTypes.func,
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
      const {
        data,
        series,
        labelAxis,
        valueAxis,
        legend,
        tooltip,
        label,
        displayCartesianGrid,
        onClick,

        barGap,
      } = props;

      const [colors] = useState(generateColors(series.length));
      const currentColors = [...colors];
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let MainChart = ComposedChart;
      const typeSet = new Set(series.map((serie) => Object.keys(COMPONENTS).find((v) => serie[v])));

      if (typeSet.size === 1) {
        MainChart = COMPONENTS[[...typeSet][0]] || MainChart;
      }

      const isNumericX = typeof data[0][labelAxis?.dataKey] === "number";
      if (isNumericX) data.sort((a, b) => a[labelAxis?.dataKey] - b[labelAxis?.dataKey]);

      return (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} barCategoryGap={barGap}>
              <XAxis
                dataKey={labelAxis?.dataKey}
                unit={labelAxis?.unit}
                type={typeof data[0][labelAxis?.dataKey] === "number" ? "number" : undefined}
                domain={["auto", "auto"]}
                ticks={labelAxis?.ticks}
              >
                {labelAxis?.title != null && <Label value={labelAxis.title} offset={0} position="insideBottomRight" />}
              </XAxis>

              <YAxis
                unit={valueAxis?.unit}
                type={typeof data[0][series[0]?.valueKey] === "number" ? "number" : undefined}
              >
                {valueAxis?.title != null && <Label value={valueAxis?.title} angle={-90} position="insideLeft" />}
              </YAxis>

              {series.map(({ valueKey, title, color, onClick, point, line, area, bar }) => {
                let Component;
                let componentProps = { onClick };
                if (title) componentProps.name = title;

                if (line) {
                  Component = Line;
                  if (typeof line === "object") {
                    const { point: dot, width: strokeWidth, ...lineProps } = line;
                    componentProps = { dot, strokeWidth, ...lineProps, ...componentProps };

                    if (typeof componentProps.label === "function") {
                      const label = componentProps.label;
                      componentProps.label = ({ x, y, stroke, value }) => {
                        const { value: resultValue, ...attrs } = label({ x, y, stroke, value }) || {};
                        return (
                          <text x={x} y={y} dy={-4} fill={stroke} textAnchor="middle" {...attrs}>
                            {resultValue ?? value}
                          </text>
                        );
                      };
                    }
                  }
                  componentProps = {
                    ...componentProps,
                    stroke: getColor(color, currentColors), // fixed value
                  };
                  componentProps.dot ??= false; // default if not set
                  componentProps.legendType = componentProps.dot ? "line" : "plainline"; // fixed value

                } else if (area) {
                  // TODO
                  Component = Area;
                  if (typeof area === "object") componentProps = { ...area, ...componentProps };
                  componentProps = { ...componentProps, stroke: getColor(color, currentColors) };
                } else if (bar) {
                  Component = Bar;
                  if (typeof bar === "object") componentProps = { ...bar, ...componentProps };
                  componentProps = { ...componentProps, fill: getColor(color, currentColors) };
                } else {
                  Component = Scatter;
                  if (typeof point === "object") componentProps = { ...point, ...componentProps };
                  componentProps = { ...componentProps, fill: getColor(color, currentColors) };
                }

                return (
                  <Component
                    {...componentProps}
                    key={valueKey}
                    dataKey={valueKey}
                  />
                );
              })}

              {tooltip != null && <Tooltip />}
              {legend != null && <Legend verticalAlign="top" />}
              {displayCartesianGrid && <CartesianGrid strokeDasharray="3 3" />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { XyChart };
export default XyChart;
