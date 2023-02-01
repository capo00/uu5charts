//@@viewOn:imports
import {
  ComposedChart,
  CartesianGrid,
  Scatter,
  Line,
  Area,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Label,
  ScatterChart,
  LineChart,
  AreaChart,
  BarChart,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { createComponent, createVisualComponent, PropTypes, useState, Utils } from "uu5g05";
import Config from "../config/config.js";
import Tooltip from "./tooltip";
import Legend from "./legend";
import Color from "./color";

//@@viewOff:imports

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

      if (series.length === 0) {
        let valueKey;
        for (let i = 0; i < data.length && !valueKey; i++) {
          valueKey = Object.keys(data[i]).find((k, _, arr) => typeof arr[k] === "number");
        }
        if (!valueKey) throw new Error("Data does not contain any number values for y axis");
        series[0] = { valueKey };
      }

      if (!labelAxis?.dataKey) {
        let dataKey;
        const keys = Object.keys(data[0]);
        const values = keys.map((k) => data.map(({ [k]: v }) => v)); // TODO find uniq values as label
        for (let i = 0; i < data.length && !dataKey; i++) {
          dataKey = Object.keys(data[i]).find((k, _, arr) => typeof arr[k] === "number");
        }
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

function getAxisYDomain(data, from, to, refList, offset) {
  const refData = [...data].slice(from - 1, to);

  const mins = [];
  const maxs = [];
  refList.forEach((ref) => {
    const values = refData.map((item) => item[ref]);
    mins.push(Math.min(...values));
    maxs.push(Math.max(...values));
  });

  const bottom = Math.min(...mins);
  const top = Math.min(...maxs);

  return [(bottom | 0) - offset, (top | 0) + offset];
}

function useZoom(data, valueKeyList) {
  const [refArea, setRefArea] = useState();

  const [domainX, setDomainX] = useState();
  const [domainY, setDomainY] = useState();

  function zoom() {
    let { left: refAreaLeft, right: refAreaRight } = refArea || {};

    if (refAreaLeft !== refAreaRight && refAreaRight != null) {
      // xAxis domain
      if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

      // yAxis domain
      const [bottom, top] = getAxisYDomain(data, refAreaLeft, refAreaRight, valueKeyList, 1);

      setDomainX([refAreaLeft, refAreaRight]);
      setDomainY([bottom, top]);
    }

    setRefArea(null);
  }

  return [
    refArea,
    domainX,
    domainY,
    // TODO 1) add touch, 2) vertical area, 3) zoom by scroll
    {
      onMouseDown: (e) => setRefArea({ left: e?.activeLabel }),
      onMouseMove: (e) =>
        refArea?.left &&
        refArea.right !== e.activeLabel &&
        setRefArea({
          ...refArea,
          right: e.activeLabel,
        }),
      onMouseUp: zoom,
      onDoubleClick: (e) => {
        e.preventDefault();
        setRefArea(null);
        setDomainX(null);
        setDomainY(null);
      },
    },
  ];
}

function useInteractiveLegend(series) {
  const [visibility, _setVisibility] = useState(() =>
    series.reduce((s, { id }, i) => {
      s[id ?? "id-" + i] = true;
      return s;
    }, {})
  );

  function setVisibility(key) {
    _setVisibility({ ...visibility, [key]: !visibility[key] });
  }

  const [hover, setHover] = useState();

  return [
    visibility,
    hover,
    {
      onClick: (e) => {
        setVisibility(e.payload.id);
        setHover(visibility[e.payload.id] ? null : e.payload.id);
      },
      onMouseEnter: (e) => visibility[e.payload.id] && setHover(e.payload.id),
      onMouseLeave: () => setHover(null),
    },
  ];
}

function CustomLabel(props) {
  const { label, labelContent: LabelContent, layout, ...restProps } = props;
  const { x, y, width, height, stroke, offset, value } = restProps;

  let result = null;
  if (typeof label === "function") {
    const Component = label;
    result = <Component {...restProps} />;
  } else if (Utils.Element.isValid(label)) {
    result = Utils.Element.clone(label, restProps);
  } else if (label === true || LabelContent) {
    if (layout === "vertical") {
      result = (
        <text
          x={x + width}
          y={y + height / 2}
          dy={offset}
          dx={value < 0 ? -2 * offset : 2 * offset}
          fill={stroke}
          textAnchor="middle"
        >
          {label === true ? value : <LabelContent {...restProps} />}
        </text>
      );
    } else {
      result = (
        <text
          x={x + (width ? width / 2 : 0)}
          y={y}
          dy={value < 0 ? 3 * offset : -offset}
          fill={stroke}
          textAnchor="middle"
        >
          {label === true ? value : <LabelContent {...restProps} />}
        </text>
      );
    }
  }

  return result;
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
              type: PropTypes.oneOf([
                "basis",
                "linear",
                "natural",
                "monotoneX",
                "monotoneY",
                "monotone",
                "step",
                "stepBefore",
                "stepAfter",
              ]),
              label: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
              labelContent: PropTypes.func,
              width: PropTypes.number,
            }),
          ]),
          area: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.shape({
              point: PropTypes.bool,
              type: PropTypes.oneOf([
                "basis",
                "linear",
                "natural",
                "monotoneX",
                "monotoneY",
                "monotone",
                "step",
                "stepBefore",
                "stepAfter",
              ]),
              label: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
              labelContent: PropTypes.func,
              stackId: PropTypes.string,
            }),
          ]),
          bar: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.shape({
              layout: PropTypes.oneOf(["horizontal", "vertical"]),
              barSize: PropTypes.number,
              maxBarSize: PropTypes.number,
              label: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
              labelContent: PropTypes.func,
              stackId: PropTypes.string,
            }),
          ]),
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
          children: PropTypes.element,
        }),
      ]),
      tooltip: PropTypes.oneOfType([PropTypes.bool, PropTypes.element]),
      label: PropTypes.shape({
        position: PropTypes.oneOf(["top", "center", "bottom"]),
        component: PropTypes.func,
      }),

      displayCartesianGrid: PropTypes.bool,
      onClick: PropTypes.func,
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
      let {
        data,
        series,
        labelAxis,
        valueAxis,
        legend,
        tooltip,
        displayCartesianGrid,
        height,

        barGap,
        layout,
      } = props;

      let isNumericX = typeof data.find((it) => it[labelAxis.dataKey] != null)[labelAxis.dataKey] === "number";
      if (isNumericX) data.sort((a, b) => a[labelAxis.dataKey] - b[labelAxis.dataKey]);

      let isNumericY = typeof data.find((it) => it[series[0].valueKey] != null)[series[0].valueKey] === "number";

      let zeroLineProps;
      const valueKeyList = Object.values(series).map(({ valueKey }) => valueKey);
      for (let item of data) {
        if (valueKeyList.find((key) => item[key] < 0)) {
          zeroLineProps = { y: 0 };
          break;
        }
      }

      if (layout === "vertical") {
        [labelAxis = {}, valueAxis] = [valueAxis, labelAxis];
        [isNumericX, isNumericY] = [isNumericY, isNumericX];
        zeroLineProps = { x: 0 };
      }

      const [colors] = useState(() => Color.generateColors(series.length));
      const currentColors = [...colors];

      const [visibilityMap, hoverId, legendAttrs] = useInteractiveLegend(series);

      const [refArea, domainX, domainY, { onDoubleClick, ...chartAttrs }] = useZoom(data, [
        ...new Set(series.map(({ valueKey }) => valueKey)),
      ]);

      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let MainChart = ComposedChart;
      const typeSet = new Set(series.map((serie) => Object.keys(COMPONENTS).find((v) => serie[v])));
      if (typeSet.size === 1) MainChart = COMPONENTS[[...typeSet][0]] || MainChart;

      return (
        <div style={{ width: "100%", height }} onDoubleClick={onDoubleClick}>
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              barCategoryGap={barGap}
              layout={layout}
              {...chartAttrs}
            >
              <XAxis
                dataKey={labelAxis.dataKey}
                unit={labelAxis.unit}
                type={isNumericX ? "number" : undefined}
                domain={domainX || ["auto", "auto"]}
                interval="preserveStartEnd"
                tickCount={10}
                tickSize={5}
                minTickGap={1}
                ticks={labelAxis.ticks}
                // because of zooming
                allowDataOverflow
              >
                {labelAxis.title != null && <Label value={labelAxis.title} offset={0} position="insideBottomRight" />}
              </XAxis>

              <YAxis
                dataKey={valueAxis?.dataKey}
                unit={valueAxis?.unit}
                type={isNumericY ? "number" : "category"}
                domain={domainY || ["auto", "auto"]}
                interval="preserveStartEnd"
                // because of zooming
                allowDataOverflow
                yAxisId="1"
              >
                {valueAxis?.title != null && <Label value={valueAxis.title} angle={-90} position="insideLeft" />}
              </YAxis>

              {zeroLineProps && <ReferenceLine {...zeroLineProps} yAxisId="1" stroke="#000" />}

              {series.map(({ id, valueKey, title, color, onClick, point, line, area, bar }, i) => {
                id ??= "id-" + i;
                let Component;
                let componentProps = { onClick, id, hide: !visibilityMap[id], yAxisId: "1" };
                if (title) componentProps.name = title;

                const opacity = hoverId && hoverId !== id ? 0.4 : undefined;

                if (line) {
                  Component = Line;
                  if (typeof line === "object") {
                    const { point: dot, width: strokeWidth, label, labelContent, ...restProps } = line;
                    componentProps = { dot, strokeWidth, ...restProps, ...componentProps };

                    if (label || labelContent)
                      componentProps.label = <CustomLabel label={label} labelContent={labelContent} />;
                  }
                  componentProps = {
                    ...componentProps,
                    stroke: Color.getColor(color, currentColors), // fixed value
                    strokeOpacity: opacity ?? componentProps.strokeOpacity,
                  };
                  componentProps.dot ??= false; // default if not set
                  componentProps.legendType = componentProps.dot ? "line" : "plainline"; // fixed value
                } else if (area) {
                  Component = Area;
                  if (typeof area === "object") {
                    const { point: dot, label, labelContent, ...restProps } = area;
                    componentProps = { dot, ...restProps, ...componentProps };

                    if (label || labelContent)
                      componentProps.label = <CustomLabel label={label} labelContent={labelContent} />;
                  }

                  const selectedColor = Color.getColor(color, currentColors);
                  componentProps = {
                    ...componentProps,
                    stroke: selectedColor,
                    fill: selectedColor, // fixed value
                    fillOpacity: opacity ?? componentProps.fillOpacity,
                  };
                  componentProps.dot ??= false; // default if not set
                  componentProps.legendType = componentProps.dot ? "line" : "plainline"; // fixed value
                } else if (bar) {
                  Component = Bar;
                  if (typeof bar === "object") {
                    const { label, labelContent, ...restProps } = bar;
                    componentProps = { ...restProps, ...componentProps };

                    if (label || labelContent)
                      componentProps.label = <CustomLabel label={label} labelContent={labelContent} layout={layout} />;
                  }
                  componentProps = {
                    ...componentProps,
                    fill: Color.getColor(color, currentColors), // fixed value
                    fillOpacity: opacity ?? componentProps.strokeOpacity,
                  };
                } else {
                  Component = Scatter;
                  if (typeof point === "object") componentProps = { ...point, ...componentProps };
                  componentProps = {
                    ...componentProps,
                    fill: Color.getColor(color, currentColors),
                    fillOpacity: opacity ?? componentProps.fillOpacity,
                  };
                }

                return <Component {...componentProps} key={valueKey} dataKey={valueKey} />;
              })}

              {displayCartesianGrid && <CartesianGrid strokeDasharray="3 3" />}
              {tooltip != null && Tooltip({ labelAxis, valueAxis, children: tooltip === true ? undefined : tooltip })}
              {legend != null && Legend({ ...(legend === true ? null : legend), ...legendAttrs })}

              {refArea?.left && refArea.right && (
                <ReferenceArea yAxisId="1" x1={refArea.left} x2={refArea.right} strokeOpacity={0.3} />
              )}
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
