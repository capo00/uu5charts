//@@viewOn:imports
import { Tooltip as RechartsTooltip } from "recharts";
import Uu5Elements from "uu5g05-elements";
import { Utils } from "uu5g05";
import Config from "../config/config.js";

//@@viewOff:imports

//@@viewOn:helpers
function DefaultTooltip(props) {
  const { active, payload, label, labelTitle, labelUnit, valueUnit } = props;

  if (active && payload && payload.length) {
    const formattedLabel = typeof label === "number" ? <Uu5Elements.Number value={label} /> : label;
    return (
      <Uu5Elements.Tile
        header={
          label ? (
            <Uu5Elements.Text category="interface" segment="title" type="micro">
              {labelTitle != null ? labelTitle + ":" : null} {formattedLabel}
              {labelUnit}
            </Uu5Elements.Text>
          ) : undefined
        }
      >
        <div className={Config.Css.css({ display: "flex", flexDirection: "column", gap: 4 })}>
          {payload.map((item, i) => {
            const { fill, name, value, payload: data, unit = valueUnit } = item;
            if (value != null) {
              const formattedValue = typeof value === "number" ? <Uu5Elements.Number value={value} /> : value;
              return (
                <div key={i} className={Config.Css.css({ paddingLeft: 8 })}>
                  <Uu5Elements.Badge size="xs" borderRadius="full" style={{ backgroundColor: fill || data.fill }} />{" "}
                  {name}: <b>{formattedValue}</b>
                  {unit}
                </div>
              );
            }
          })}
        </div>
      </Uu5Elements.Tile>
    );
  }

  return null;
}

function CustomTooltip(props) {
  const { active, payload, label, children, unit: propsUnit } = props;

  let result = null;

  if (active) {
    const propsToPass = {
      label,
      series: payload.map(({ dataKey, value, color, name, payload, unit = propsUnit }) => ({
        valueKey: dataKey,
        title: name,
        value,
        unit,
        color: color ?? payload.fill,
        data: payload,
      })),
    };

    result = typeof children === "function" ? children(propsToPass) : Utils.Element.clone(children, propsToPass);
  }

  return result;
}

//@@viewOff:helpers

function Tooltip(props) {
  //@@viewOn:private
  const { labelAxis, valueAxis, children } = props;
  // do not use hooks, this is not used like react component, but like function
  //@@viewOff:private

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:render
  return (
    <RechartsTooltip
      offset={8}
      cursor={false}
      allowEscapeViewBox={{ x: false, y: true }}
      content={
        children ? (
          <CustomTooltip unit={valueAxis?.unit}>{children}</CustomTooltip>
        ) : (
          <DefaultTooltip labelTitle={labelAxis?.title} labelUnit={labelAxis?.unit} valueUnit={valueAxis?.unit} />
        )
      }
    />
  );
  //@@viewOff:render
}

export { Tooltip };
export default Tooltip;
