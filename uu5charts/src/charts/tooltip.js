//@@viewOn:imports
import { Tooltip as RechartsTooltip } from "recharts";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

//@@viewOff:imports

//@@viewOn:helpers
function CustomTooltip(props) {
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
          {payload.map(({ color, dataKey, name, value, payload: data }, i) => {
            if (value != null) {
              const formattedValue = typeof value === "number" ? <Uu5Elements.Number value={value} /> : value;
              return (
                <div key={i} className={Config.Css.css({ paddingLeft: 8 })}>
                  <Uu5Elements.Badge size="xs" borderRadius="full"
                                     style={{ backgroundColor: color || data.fill }} />{" "}
                  {name}: <b>{formattedValue}</b>
                  {valueUnit}
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

//@@viewOff:helpers

function Tooltip(props) {
  //@@viewOn:private
  const { labelAxis, valueAxis, children, ...propsToPass } = props;
  // do not use hooks, this is not used like react component, but like function
  //@@viewOff:private

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:render
  return (
    <RechartsTooltip
      offset={8}
      cursor={false}
      allowEscapeViewBox={{ x: true, y: true }}
      {...propsToPass}
      content={
        children || (
          <CustomTooltip labelTitle={labelAxis?.title} labelUnit={labelAxis?.unit} valueUnit={valueAxis?.unit} />
        )
      }
    />
  );
  //@@viewOff:render
}

export { Tooltip };
export default Tooltip;
