//@@viewOn:imports
import { createVisualComponent, useMemo, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import Config from "../config/config.js";

//@@viewOff:imports

const ROUNDER = 10 ** 5;

function round(value) {
  return typeof value === "number" ? Math.round(value * ROUNDER) / ROUNDER : value;
}

function isNA(value) {
  return value == null || value === "";
}

function DeletedValue(props) {
  const { value, data, onChange, columnList, onFilter } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Uu5Elements.Button
        icon="mdi-delete"
        colorScheme="negative"
        size="xxs"
        onClick={() => onChange(data.filter(onFilter))}
        tooltip={{ cs: "Odebrat položky" }}
        className={Config.Css.css({ marginRight: 8 })}
      />

      <Uu5Elements.Link tooltip={{ cs: "Zobraz položky" }} onClick={() => setOpen(true)}>
        {value}
      </Uu5Elements.Link>

      <Uu5Elements.Modal width="100%" open={open} onClose={() => setOpen(false)}>
        <Uu5Tiles.ControllerProvider data={data.filter((...args) => !onFilter(...args))}>
          <Uu5TilesElements.List columnList={columnList} tileMinWidth={300} tileMaxWidth={350} />
        </Uu5Tiles.ControllerProvider>
      </Uu5Elements.Modal>
    </>
  );
}

function DuplicatedAlert(props) {
  const { data, duplicated, columnList, onChange } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Uu5Elements.Alert header={`${duplicated.length} duplicitních záznamů`}>
        <Uu5Elements.Button onClick={() => setOpen(true)}>Zobrazit</Uu5Elements.Button>
        <Uu5Elements.Button
          colorScheme="negative"
          onClick={() => {
            onChange(data.filter((it) => !duplicated.includes(it)));
          }}
        >
          Odstranit
        </Uu5Elements.Button>
      </Uu5Elements.Alert>
      <Uu5Elements.Modal width="100%" open={open} onClose={() => setOpen(false)}>
        <Uu5Tiles.ControllerProvider data={duplicated}>
          <Uu5TilesElements.List columnList={columnList} tileMinWidth={300} tileMaxWidth={350} />
        </Uu5Tiles.ControllerProvider>
      </Uu5Elements.Modal>
    </>
  );
}

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
    const { data, onChange, ...blockProps } = props;

    const stats = useMemo(() => {
      const stats = {};

      data.keys().forEach((colName) => {
        const columnData = data.values(colName);
        const filledArr = columnData.filled();
        const filled = filledArr.length;
        stats[colName] = {
          filled,
          empty: columnData.length - filled,
          min: columnData.min(),
          max: columnData.max(),
          range: columnData.isNumeric() ? columnData.max() - columnData.min() : undefined,
          sum: columnData.sum(),
          median: columnData.median(),
          mean: columnData.median(),
          variance: round(columnData.sampleVariance()),
          standardDeviation: round(columnData.sampleStandardDeviation()),
          varianceCoefficient: round(columnData.sampleVarianceCoefficient()),
        };
      });

      return stats;
    }, [data]);

    const duplicatedData = data.getDuplicated();

    const columnNames = [...data.keys()];
    columnNames.shift(); // first column is Name

    const columnList = data.keys().map((colName) => ({
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
    }));

    const rowNames = Object.keys(stats[columnNames[0]]);

    const footerMap = {};

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

      columnNames.forEach((colName) => {
        const name = [colName, rowName].join("-");
        row.push(name);
        footerMap[name] = {
          footerComponent: (
            <Uu5TilesElements.Table.FooterCell horizontalAlignment="right" verticalAlignment="center">
              {["empty"].includes(rowName) && stats[colName][rowName] > 0 ? (
                <DeletedValue
                  value={stats[colName][rowName]}
                  data={data}
                  onChange={onChange}
                  columnList={columnList}
                  onFilter={(it) => !isNA(it[colName])}
                />
              ) : (
                stats[colName][rowName]
              )}
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
          {duplicatedData.length > 0 && (
            <DuplicatedAlert data={data} duplicated={duplicatedData} columnList={columnList} onChange={onChange} />
          )}
          <Uu5TilesElements.List
            columnList={columnList}
            tileMinWidth={300}
            tileMaxWidth={350}
            height={800}
            cellHoverExtent={["row", "column"]}
            footerTemplate={footerTemplate.join(",")}
            footerContentMap={footerMap}
            sortable // not working yet
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
