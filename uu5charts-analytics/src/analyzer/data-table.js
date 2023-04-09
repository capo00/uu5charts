//@@viewOn:imports
import { createVisualComponent, useMemo, useScreenSize, useState, Utils, Fragment } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import Config from "../config/config.js";
import List from "./list";
import { round } from "../model/tools";

//@@viewOff:imports
function roundNumber(value) {
  return typeof value === "number" ? round(value) : value;
}

function isNA(value) {
  return value == null || value === "";
}

function DeletedValue(props) {
  const { value, data, onChange, onFilter } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      {onChange && (
        <Uu5Elements.Button
          icon="mdi-delete"
          colorScheme="negative"
          size="xxs"
          onClick={() => onChange(data.filter(onFilter))}
          tooltip={{ cs: "Odebrat položky" }}
          className={Config.Css.css({ marginRight: 8 })}
        />
      )}

      <Uu5Elements.Link tooltip={{ cs: "Zobraz položky" }} onClick={() => setOpen(true)}>
        {value}
      </Uu5Elements.Link>

      <Uu5Elements.Modal width="100%" open={open} onClose={() => setOpen(false)}>
        <List data={data.filter((...args) => !onFilter(...args))} tileMinWidth={300} tileMaxWidth={350} />
      </Uu5Elements.Modal>
    </>
  );
}

function DuplicatedAlert(props) {
  const { data, duplicated, onChange } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Uu5Elements.Alert header={`${duplicated.length} duplicitních záznamů`}>
        <Uu5Elements.Button onClick={() => setOpen(true)}>Zobrazit</Uu5Elements.Button>
        {onChange && (
          <Uu5Elements.Button
            colorScheme="negative"
            onClick={() => {
              onChange(data.filter((it) => !duplicated.includes(it)));
            }}
          >
            Odstranit
          </Uu5Elements.Button>
        )}
      </Uu5Elements.Alert>
      <Uu5Elements.Modal width="100%" open={open} onClose={() => setOpen(false)}>
        <List data={duplicated} tileMinWidth={300} tileMaxWidth={350} />
      </Uu5Elements.Modal>
    </>
  );
}

function downloadByLink(href, name) {
  let a = document.createElement("a");
  a.style.cssText = "position: absolute; top:0; left: 0; height: 0; width: 0; overflow: hidden; display: block;";
  document.body.appendChild(a);
  a.rel = "noopener";
  a.download = name;
  a.href = href;
  a.click();
  a.remove();
}

function ControlledControllerProvider({ data, children }) {
  const [sorterList, setSorterList] = useState();

  return (
    <Uu5Tiles.ControllerProvider
      data={data}
      sorterList={sorterList}
      onSorterChange={(e) => setSorterList(e.data.sorterList)}
    >
      {children}
    </Uu5Tiles.ControllerProvider>
  );
}

const STATS_NAME = {
  filled: "Vyplněno",
  empty: "Prázdno",
  type: "Datový typ",
  min: "Min",
  max: "Max",
  range: "Rozsah",
  sum: "Součet",
  median: "Medián",
  mean: "Průměr",
  variance: "Rozptyl",
  standardDeviation: "Směrodatná odchylka",
  varianceCoefficient: "Koeficient variability",
};

function renderStatsValue(key, value, data, onChange, name) {
  return ["empty"].includes(key) && value > 0 ? (
    <DeletedValue value={value} data={data} onChange={onChange} onFilter={(it) => !isNA(it[name])} />
  ) : (
    <span
      title={`Zkopírovat ${value}`}
      onClick={() => Utils.Clipboard.write(value + "")}
      className={Config.Css.css({ cursor: "copy" })}
    >
      {roundNumber(value)}
    </span>
  );
}

function SummaryTile({ data, selectable, dataArr, onChange, ...props }) {
  const { name, ...stats } = data;
  return (
    <Uu5Elements.Tile {...props} header={name}>
      <Uu5Elements.Grid templateColumns="repeat(2, minmax(100px, 1fr))" rowGap={4} columnGap={4}>
        {Object.entries(stats).map(([k, v]) => (
          <Fragment key={k}>
            <div>{STATS_NAME[k]}</div>
            <div className={Config.Css.css({ alignSelf: "end" })}>
              {renderStatsValue(k, v, dataArr, onChange, name)}
            </div>
          </Fragment>
        ))}
      </Uu5Elements.Grid>
    </Uu5Elements.Tile>
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

    const [screenSize] = useScreenSize();

    const stats = useMemo(() => {
      const stats = {};

      data.keys().forEach((colName) => {
        const columnData = data.values(colName);
        const filledArr = columnData.filled();
        const filled = filledArr.length;
        stats[colName] = {
          filled,
          empty: columnData.length - filled,
          type: columnData.isNumeric() ? "numeric" : "categorical",
          min: columnData.min(),
          max: columnData.max(),
          range: columnData.isNumeric() ? columnData.max() - columnData.min() : undefined,
          sum: columnData.sum(),
          median: columnData.median(),
          mean: columnData.median(),
          variance: columnData.sampleVariance(),
          standardDeviation: columnData.sampleStandardDeviation(),
          varianceCoefficient: columnData.sampleVarianceCoefficient(),
        };
      });

      return stats;
    }, [data]);

    const duplicatedData = data.getDuplicated();

    const columnNames = [...data.keys()];

    const columnListWithOrder = ["_i", ...data.keys()].map((colName) => ({
      value: colName,
      header: colName === "_i" ? "#" : colName,
      sortable: true,
      cellComponent: ({ children, ...params }) => (
        <Uu5TilesElements.Table.Cell
          {...params}
          horizontalAlignment={typeof children === "number" ? "right" : undefined}
        >
          {children}
        </Uu5TilesElements.Table.Cell>
      ),
    }));

    let footerMap,
      footerTemplate,
      summary,
      isSmall = ["xs", "s"].includes(screenSize);

    if (isSmall) {
      summary = (
        <Uu5Elements.Block headerType="title" header="Přehled">
          <Uu5TilesElements.Grid height={800} data={Object.entries(stats).map(([k, v]) => ({ name: k, ...v }))}>
            <SummaryTile dataArr={data} onChange={onChange} />
          </Uu5TilesElements.Grid>
        </Uu5Elements.Block>
      );
    } else {
      const rowNames = Object.keys(stats[columnNames[0]]);

      footerMap = {};

      footerTemplate = [];
      rowNames.forEach((rowName) => {
        const row = [rowName];
        footerMap[rowName] = {
          footerComponent: (
            <Uu5TilesElements.Table.FooterCell horizontalAlignment="left" verticalAlignment="center">
              {STATS_NAME[rowName]}
            </Uu5TilesElements.Table.FooterCell>
          ),
        };

        columnNames.forEach((colName) => {
          const name = [colName, rowName].join("-");
          row.push(name);
          footerMap[name] = {
            footerComponent: (
              <Uu5TilesElements.Table.FooterCell horizontalAlignment="right" verticalAlignment="center">
                {renderStatsValue(rowName, stats[colName][rowName], data, onChange, colName)}
              </Uu5TilesElements.Table.FooterCell>
            ),
          };
        });
        footerTemplate.push(row.join(" "));
      });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ControlledControllerProvider data={data.map((it, i) => ({ _i: i + 1, ...it }))}>
        <Uu5Elements.Block
          headerType="title"
          collapsible={isSmall}
          {...blockProps}
          actionList={[
            { component: <Uu5TilesControls.SearchButton /> },
            ...blockProps.actionList,
            {
              icon: "mdi-download",
              tooltip: { cs: "Stáhnout" },
              itemList: [
                {
                  children: "Stáhnout json",
                  onClick: () => {
                    const file = new File([JSON.stringify(data, null, 2)], "data.json", {
                      type: "application/json",
                    });
                    downloadByLink(URL.createObjectURL(file), file.name);
                  },
                },
                {
                  children: "Stáhnout csv",
                  onClick: () => {
                    const keys = data.keys();
                    const rows = [
                      keys.join(";"),
                      ...data.map((it) =>
                        keys.map((k) => (typeof it[k] === "string" ? `"${it[k]}"` : it[k] ?? "")).join(";")
                      ),
                    ];
                    const file = new File([rows.join("\n")], "data.csv", { type: "text/csv" });
                    downloadByLink(URL.createObjectURL(file), file.name);
                  },
                },
              ],
            },
          ]}
        >
          {duplicatedData.length > 0 && onChange && (
            <DuplicatedAlert data={data} duplicated={duplicatedData} onChange={onChange} />
          )}
          <Uu5TilesElements.List
            columnList={columnListWithOrder}
            tileMinWidth={300}
            tileMaxWidth={350}
            height={800}
            cellHoverExtent={["row", "column"]}
            footerTemplate={footerTemplate?.join(",")}
            footerContentMap={footerMap}
          />
        </Uu5Elements.Block>

        {summary}
      </ControlledControllerProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataTable };
export default DataTable;
