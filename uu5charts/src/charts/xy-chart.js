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
  ZAxis,
} from "recharts";
import { createComponent, createVisualComponent, PropTypes, useEffect, useRef, useState } from "uu5g05";
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
      let { data, series = [], labelAxis = {}, ...restProps } = props;

      const firstItem = data[0];
      let itemKeys;

      if (typeof firstItem === "number") {
        // array of numbers

        data = data.map((v, i) => ({ label: i, value: v }));
        labelAxis.dataKey = "label";
        series[0] ||= {};
        series[0].valueKey = "value";
      } else if (Array.isArray(firstItem)) {
        // array of arrays

        data = data.map((arr) => Object.fromEntries(arr.map((v, i) => [i, v])));
        labelAxis.dataKey ??= 0;
        series[0] ||= {};
        series[0].valueKey ??= 1;
      }

      // array of objects

      let firstNumberKey;
      if (labelAxis.dataKey == null) {
        let firstStringKey;
        itemKeys ??= Object.keys(firstItem);
        const seriesKeys = series.map(({ valueKey }) => valueKey);

        for (let i = 0; i < itemKeys.length && !labelAxis.dataKey; i++) {
          const k = itemKeys[i];
          if (!seriesKeys.includes(k)) {
            if (typeof firstItem[k] === "string") {
              const keyValues = data.map(({ [k]: v }) => v);
              // find unique values
              if (new Set(keyValues).size === keyValues.length) {
                labelAxis.dataKey = k;
                break;
              } else if (!firstStringKey) firstStringKey = k;
            } else if (typeof firstItem[k] === "number" && firstNumberKey == null) {
              firstNumberKey = k;
            }
          }
        }

        // set default if not found optimal solution
        if (!labelAxis.dataKey) {
          if (firstStringKey) labelAxis.dataKey = firstStringKey;
          else if (firstNumberKey) labelAxis.dataKey = firstNumberKey;
          else throw new Error("Data does not contain any string or number values for x axis.");
        }
      }

      if (series.length === 0) {
        let valueKey;
        if (firstNumberKey && firstNumberKey !== labelAxis.dataKey) {
          valueKey = firstNumberKey;
        } else {
          for (let i = 0; i < data.length && !valueKey; i++) {
            const k = itemKeys[i];
            if (typeof firstItem[k] === "number" && k !== firstNumberKey) {
              valueKey = k;
              break;
            }
          }
          if (!valueKey) throw new Error("Data does not contain any number values for y axis.");
        }
        series.push({ valueKey });
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

function DefaultLineLabel(props) {
  const { viewBox, title, titlePosition = "middle", offset, stroke } = props;
  const { x, y, width } = viewBox;

  let posX;

  switch (titlePosition) {
    case "middle":
      posX = x + width / 2;
      break;
    case "start":
      posX = x;
      break;
    case "end":
      posX = x + width;
      break;
  }

  return (
    <text x={posX} y={y} dy={-offset} stroke={stroke} textAnchor={titlePosition} opacity={0.4}>
      {title}
    </text>
  );
}

const COMPONENTS = {
  point: ScatterChart,
  line: LineChart,
  area: AreaChart,
  bar: BarChart,
};

function handleSerieClick(onClick) {
  return typeof onClick === "function"
    ? ({ payload }) => onClick({ ...(payload ? { data: payload } : null) })
    : undefined;
}

function dashToCamel(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

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
          valueKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          title: PropTypes.node,
          color: PropTypes.string,
          onClick: PropTypes.func,
          label: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.shape({
              position: PropTypes.oneOf([
                "center",
                "top",
                "left",
                "right",
                "bottom",
                "inside",
                "outside",
                "inside-top",
                "inside-left",
                "inside-right",
                "inside-bottom",
                "inside-top-left",
                "inside-bottom-left",
                "inside-top-right",
                "inside-bottom-right",
              ]),
              children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
            }),
          ]),
          unit: PropTypes.string,

          point: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.shape({
              shape: PropTypes.oneOf(["circle", "cross", "diamond", "square", "star", "triangle", "wye"]),
              sizeKey: PropTypes.string,
            }),
          ]),
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
              stackId: PropTypes.string,
            }),
          ]),
          bar: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.shape({
              layout: PropTypes.oneOf(["horizontal", "vertical"]),
              width: PropTypes.number,
              maxWidth: PropTypes.number,
              stackId: PropTypes.string,
            }),
          ]),
        })
      ),

      labelAxis: PropTypes.shape({
        dataKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string,
        unit: PropTypes.string,
      }),
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
          layout: PropTypes.oneOf(["horizontal", "vertical"]),
          children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
        }),
      ]),
      tooltip: PropTypes.oneOfType([PropTypes.bool, PropTypes.element, PropTypes.func]),

      lines: PropTypes.arrayOf(
        PropTypes.shape({
          x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          title: PropTypes.node,
          titlePosition: PropTypes.oneOf(["start", "middle", "end"]),
          width: PropTypes.number,
          color: PropTypes.string,
        })
      ),

      displayCartesianGrid: PropTypes.bool,
      width: PropTypes.unit,
      height: PropTypes.unit,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      data: [],
      series: [],
      tooltip: true,
      lines: [],
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
        lines,
        width = "100%",
        height,

        barGap,
        layout,
      } = props;

      let isNumericX = typeof data.find((it) => it[labelAxis.dataKey] != null)[labelAxis.dataKey] === "number";
      if (isNumericX) data.sort((a, b) => a[labelAxis.dataKey] - b[labelAxis.dataKey]);

      let isNumericY = typeof data.find((it) => it[series[0].valueKey] != null)[series[0].valueKey] === "number";

      let zeroLineProps;
      const valueKeyList = series.map(({ valueKey }) => valueKey);
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

      let zAxis;

      const ref = useRef();
      useEffect(() => {
        const element = ref.current?.current;
        element.addEventListener("dblclick", onDoubleClick);
        return () => {
          element.removeEventListener("dblclick", onDoubleClick);
        };
      }, [onDoubleClick]);

      return (
        <ResponsiveContainer
          aspect={!width || !height ? 16 / 9 : undefined}
          width={width}
          height={height}
          minWidth={0}
          ref={ref}
        >
          <ComposedChart
            data={data}
            margin={{ top: 24, right: 8, bottom: 8, left: 8 }}
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

            {series.map(({ id, valueKey, title, color, onClick, label, unit, point, line, area, bar }, i) => {
              id ??= "id-" + i;
              let Component;
              let componentProps = {
                onClick: handleSerieClick(onClick),
                id,
                unit,
                hide: !visibilityMap[id],
                yAxisId: "1",
              };
              if (title) componentProps.name = title;

              const opacity = hoverId && hoverId !== id ? 0.4 : undefined;

              if (label === true) label = {};
              else if (label && label.position) label.position = dashToCamel(label.position);

              if (line) {
                Component = Line;
                if (typeof line === "object") {
                  const { point: dot, width: strokeWidth, ...restProps } = line;
                  componentProps = { dot, strokeWidth, ...restProps, ...componentProps };
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
                  const { point: dot, ...restProps } = area;
                  componentProps = { dot, ...restProps, ...componentProps };
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
                  const { width: barSize, maxWidth: maxBarSize, ...restProps } = bar;
                  componentProps = { barSize, maxBarSize, ...restProps, ...componentProps };
                }

                if (label && layout === "vertical") {
                  label = { ...label, position: label.position ?? "right" };
                }

                componentProps = {
                  ...componentProps,
                  fill: Color.getColor(color, currentColors), // fixed value
                  fillOpacity: opacity ?? componentProps.fillOpacity,
                };
              } else {
                Component = Scatter;
                if (typeof point === "object") {
                  const { sizeKey, ...restProps } = point;
                  componentProps = { ...restProps, ...componentProps };

                  if (sizeKey) zAxis = <ZAxis dataKey={sizeKey} range={[10, 100]} />;
                }
                componentProps = {
                  ...componentProps,
                  fill: Color.getColor(color, currentColors),
                  fillOpacity: opacity ?? componentProps.fillOpacity,
                };
              }

              return (
                <Component {...componentProps} key={valueKey} dataKey={valueKey}>
                  {label && DefaultLabel({ dataKey: valueKey, ...label })}
                </Component>
              );
            })}

            {zAxis}

            {displayCartesianGrid && <CartesianGrid strokeDasharray="3 3" />}
            {tooltip && Tooltip({ labelAxis, valueAxis, children: tooltip === true ? undefined : tooltip })}
            {legend && Legend({ ...(legend === true ? null : legend), ...legendAttrs })}

            {refArea?.left && refArea.right && (
              <ReferenceArea yAxisId="1" x1={refArea.left} x2={refArea.right} strokeOpacity={0.3} />
            )}

            {lines.map(({ x, y, title, titlePosition, color, width }) => {
              const stroke = Color.getColor(color);
              return (
                <ReferenceLine
                  key={"" + x + y}
                  yAxisId="1"
                  x={x}
                  y={y}
                  label={<DefaultLineLabel title={title} titlePosition={titlePosition} stroke={stroke} />}
                  stroke={stroke}
                  strokeWidth={width}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { XyChart };
export default XyChart;
