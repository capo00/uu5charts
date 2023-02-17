//@@viewOn:imports
import { createVisualComponent, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import Config from "../config/config.js";
import Data from "../model/data";

//@@viewOff:imports

const DataTable = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataTable",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    header: "Data",
    actionList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data, ...blockProps } = props;

    const columnNames = Object.keys(data[0]);

    const stats = useMemo(() => {
      const stats = {};

      columnNames.forEach((colName) => {
        const columnData = data.values(colName);
        const filled = columnData.filled().length;
        stats[colName] = {
          filled,
          empty: columnData.length - filled,
          min: columnData.min(),
          max: columnData.max(),
          range: columnData.isNumeric() ? columnData.max() - columnData.min() : undefined,
          sum: columnData.sum(),
          median: columnData.median(),
          mean: columnData.median(),
          // var,
          // std.dev,
          // coef.var
        };
      });

      return stats;
    }, [data]);

    const rowNames = Object.keys(stats[columnNames[0]]);

    const footerMap = {
      empty: {},
      classification: {
        footerComponent: (
          <Uu5TilesElements.Table.FooterCell horizontalAlignment="center" verticalAlignment="bottom">
            Classification
          </Uu5TilesElements.Table.FooterCell>
        ),
      },
    };

    const footerTemplate = [];
    rowNames.forEach((rowName, i) => {
      const row = [rowName];
      footerMap[rowName] = {
        footerComponent: (
          <Uu5TilesElements.Table.FooterCell horizontalAlignment="left" verticalAlignment="center">
            {rowName}
          </Uu5TilesElements.Table.FooterCell>
        ),
      };

      columnNames.forEach((colName, j) => {
        const name = [colName, rowName].join("-");
        row.push(name);
        footerMap[name] = {
          footerComponent: (
            <Uu5TilesElements.Table.FooterCell horizontalAlignment="right" verticalAlignment="center">
              {stats[colName][rowName]}
            </Uu5TilesElements.Table.FooterCell>
          ),
        };
      });
      footerTemplate.push(row.join(" "));
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Tiles.ControllerProvider data={data}>
        <Uu5Elements.Block
          headerType="title"
          {...blockProps}
          actionList={[{ component: <Uu5TilesControls.SearchButton /> }, ...blockProps.actionList]}
        >
          <Uu5TilesElements.List
            tileMinWidth={300}
            tileMaxWidth={350}
            height={600}

            footerTemplate={footerTemplate.join(",")}
            footerContentMap={footerMap}
          />
        </Uu5Elements.Block>
      </Uu5Tiles.ControllerProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataTable };
export default DataTable;
