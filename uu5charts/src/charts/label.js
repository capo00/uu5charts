//@@viewOn:imports
import { LabelList } from "recharts";
import { Utils } from "uu5g05";

//@@viewOff:imports

//@@viewOn:helpers
function CustomLabel(props) {
  const { children, value, x, y, offset, width, height, viewBox } = props;

  const propsToPass = {
    value,
    x,
    y,
    offset,
    viewBox,
  };

  if (width) propsToPass.width = width;
  if (height) propsToPass.height = height;

  return typeof children === "function" ? children(propsToPass) : Utils.Element.clone(children, propsToPass);
}

//@@viewOff:helpers

function Label(props) {
  //@@viewOn:private
  const { position = "top", dataKey, children } = props;
  //@@viewOff:private

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:render
  return (
    <LabelList
      dataKey={dataKey}
      position={position}
      content={children ? <CustomLabel>{children}</CustomLabel> : undefined}
    />
  );
  //@@viewOff:render
}

export { Label };
export default Label;
