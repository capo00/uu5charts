//@@viewOn:imports
import { createVisualComponent, useEffect, useMemo, useRef } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import DataTable from "./data-table";
import Data from "../model/data";

//@@viewOff:imports

const DataLoading = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataLoading",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, setItemValue } = useFormApi();

    const { data } = value;
    const initialData = useRef(data).current;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div>
        {!initialData && (
          <>
            <Uu5Forms.FormLink
              name="dataUri"
              label="Data URI"
              disabled={!!value.dataFile}
              onBlur={async (e) => {
                if (e.data.value) {
                  const res = await fetch(e.data.value);
                  const loadedData = await res.json();
                  setItemValue("data", new Data(loadedData));
                } else {
                  setItemValue("data", null);
                }
              }}
            />
            <Uu5Forms.FormFile
              name="dataFile"
              label="Data file (csv)"
              accept=".csv"
              disabled={!!value.dataUri}
              onChange={async (e) => {
                if (e.data.value) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    let keys;
                    const rows = [];
                    reader.result.split("\n").forEach((row, i) => {
                      row = row.trim().split(/\s*;\s*/);
                      if (i === 0) keys = row;
                      else {
                        const item = {};
                        keys.forEach((k, i) => {
                          let value = row[i];
                          item[k] = value && +value == value ? +value : value;
                        });
                        rows.push(item);
                      }
                    });
                    setItemValue("data", new Data(rows));
                  };
                  // start reading the file. When it is done, calls the onload event defined above.
                  reader.readAsBinaryString(e.data.value);
                } else {
                  setItemValue("data", null);
                }
              }}
            />
          </>
        )}
        {data && <DataTable data={data} onChange={(data) => setItemValue("data", new Data(data))} />}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataLoading };
export default DataLoading;
