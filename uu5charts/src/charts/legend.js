//@@viewOn:imports
import { Legend as RechartsLegend } from "recharts";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

//@@viewOff:imports

//@@viewOn:helpers
function CustomLegend(props) {
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
        })}
      >
        {payload.map(({ color, value, inactive, payload: data }, i) => {
          return (
            <Uu5Elements.Text
              key={i}
              colorScheme="building"
              significance={inactive ? "subdued" : undefined}
              hoverable={inactive || activeLength > 1}
              elementAttrs={{
                onClick: inactive || activeLength > 1 ? () => onClick({ payload: data }) : undefined,
                onMouseEnter: () => onMouseEnter({ payload: data }),
                onMouseLeave: () => onMouseLeave({ payload: data }),
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
      content={
        children || (
          <CustomLegend title={title} />
        )
      }
    />
  );
  //@@viewOff:render
}

export { Legend };
export default Legend;
