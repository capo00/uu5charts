//@@viewOn:imports
import { createVisualComponent, useEffect, useRef, useState, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import DataTable from "./data-table";
import Data from "../model/data";
import withData from "./with-data";
//@@viewOff:imports

function parseCsvValue(value) {
  return /^"|"$/g.test(value) ? value.replace(/^"|"$/g, "") : value && +value == value ? +value : value;
}

function parseData(text) {
  let keys;
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // no json, but csv
  }
  if (!data) {
    data = [];
    text.split("\n").forEach((row, i) => {
      row = row.trim().split(/\s*;\s*/);
      if (i === 0) keys = row.map(parseCsvValue);
      else {
        const item = {};
        keys.forEach((k, i) => {
          item[k] = parseCsvValue(row[i]);
        });
        data.push(item);
      }
    });
  }
  return data;
}

const DataLoading = withData(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "DataLoading",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.instanceOf(Data),
      uri: PropTypes.string,
      onDataChange: PropTypes.func,
      omitEmpty: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { data: propsData, onDataChange, omitEmpty, uri, ...blockProps } = props;
      let data = propsData;
      if (propsData && omitEmpty) data = data.removeEmpty();

      const [dataUri, setDataUri] = useState(uri);
      const [dataFile, setDataFile] = useState();
      const initialData = useRef(data).current;

      async function loadData(uri = dataUri) {
        let data = null;
        if (uri) {
          const res = await fetch(uri);
          const text = await res.text();
          data = new Data(parseData(text));
          if (omitEmpty) data = data.removeEmpty();
        }
        onDataChange(data);
      }

      useEffect(() => {
        if (uri) loadData(uri);
      }, [uri]);
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Uu5Elements.Block headerType="heading" header="Načtení dat" level={2} {...blockProps}>
          {!initialData && !uri && (
            <Uu5Elements.Grid templateColumns={{ xs: "1fr", m: "2fr 1fr" }} rowGap={16} columnGap={16}>
              <Uu5Forms.Link
                name="dataUri"
                label="Data URI"
                disabled={!!dataFile}
                value={dataUri}
                onChange={(e) => setDataUri(e.data.value)}
                onBlur={loadData}
              />
              <Uu5Forms.File
                name="dataFile"
                label="Data file (csv)"
                accept=".csv,.json"
                disabled={!!dataUri}
                value={dataFile}
                onChange={async (e) => {
                  if (e.data.value) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      let data = new Data(parseData(reader.result));
                      if (omitEmpty) data = data.removeEmpty();
                      onDataChange(data);
                    };
                    // start reading the file. When it is done, calls the onload event defined above.
                    reader.readAsBinaryString(e.data.value);
                  } else {
                    onDataChange(null);
                  }
                  setDataFile(e.data.value);
                }}
              />
            </Uu5Elements.Grid>
          )}
          {data && (
            <DataTable data={data} onChange={onDataChange ? (data) => onDataChange(new Data(data)) : undefined} />
          )}
        </Uu5Elements.Block>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { DataLoading };
export default DataLoading;
