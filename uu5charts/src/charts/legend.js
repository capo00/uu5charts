//@@viewOn:imports
import { Legend as RechartsLegend } from "recharts";
import Uu5Elements from "uu5g05-elements";
import { Utils } from "uu5g05";
import Config from "../config/config.js";

//@@viewOff:imports

//@@viewOn:helpers
function DefaultLegend(props) {
  const { title, payload, layout, align, onClick, onMouseEnter, onMouseLeave } = props;
  const activeLength = payload.filter(({ inactive }) => !inactive).length;

  return (
    <Uu5Elements.Tile
      header={
        title ? (
          <Uu5Elements.Text category="interface" segment="title" type="micro">
            {title}
          </Uu5Elements.Text>
        ) : undefined
      }
      className={Config.Css.css({
        width: "fit-content",
        backgroundColor: "rgba(255, 255, 255, .7)",
        margin: align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : undefined,
      })}
    >
      <div
        className={Config.Css.css({
          display: "flex",
          flexDirection: layout === "vertical" ? "column" : undefined,
          gap: layout === "vertical" ? 4 : 8,
          flexWrap: "wrap",
        })}
      >
        {payload.map(({ color, value, inactive, payload }, i) => {
          return (
            <Uu5Elements.Text
              key={i}
              colorScheme="building"
              significance={inactive ? "subdued" : undefined}
              hoverable={inactive || activeLength > 1}
              elementAttrs={{
                onClick: inactive || activeLength > 1 ? () => onClick({ payload }) : undefined,
                onMouseEnter: () => onMouseEnter({ payload }),
                onMouseLeave: () => onMouseLeave({ payload }),
              }}
            >
              <Uu5Elements.Badge
                size="xs"
                borderRadius="full"
                {...(inactive ? { colorScheme: "dim" } : { style: { backgroundColor: color } })}
              />{" "}
              {value}
            </Uu5Elements.Text>
          );
        })}
      </div>
    </Uu5Elements.Tile>
  );
}

function CustomLegend(props) {
  const { layout, payload, align, verticalAlign, children } = props;

  const propsToPass = {
    layout,
    align,
    verticalAlign,
    series: payload.map(({ dataKey, value, color, payload }) => ({
      valueKey: dataKey,
      title: value,
      color: color ?? payload.fill,
    })),
  };

  return typeof children === "function" ? children(propsToPass) : Utils.Element.clone(children, propsToPass);
}

//@@viewOff:helpers

function Legend(props) {
  //@@viewOn:private
  let { title, position = "top-center", children, layout, ...propsToPass } = props;
  const [verticalAlign, align] = position.split("-");
  layout ??= verticalAlign === "middle" ? "vertical" : "horizontal";
  //@@viewOff:private

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:render
  return (
    <RechartsLegend
      {...propsToPass}
      verticalAlign={verticalAlign}
      align={align}
      layout={layout}
      content={children ? <CustomLegend>{children}</CustomLegend> : <DefaultLegend title={title} />}
    />
  );
  //@@viewOff:render
}

export { Legend };
export default Legend;
