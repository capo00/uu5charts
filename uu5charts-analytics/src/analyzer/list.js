//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Config from "../config/config.js";

//@@viewOff:imports

const List = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "List",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { data, columnList, ...restProps } = props;

    columnList ??= data
      ? Object.keys(data[0])
          .filter((k) => !/^_/.test(k))
          .map((colName) => ({
            value: colName,
            header: colName,
            cellComponent: ({ children, ...params }) => (
              <Uu5TilesElements.Table.Cell
                {...params}
                horizontalAlignment={typeof children === "number" ? "right" : undefined}
              >
                {children}
              </Uu5TilesElements.Table.Cell>
            ),
          }))
      : undefined;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Tiles.ControllerProvider data={data}>
        <Uu5TilesElements.List {...restProps} columnList={columnList} />
      </Uu5Tiles.ControllerProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export default List;
