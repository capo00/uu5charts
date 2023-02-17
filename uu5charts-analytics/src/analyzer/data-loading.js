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
          <Uu5Forms.FormLink
            name="dataUri"
            label="Data"
            onBlur={async (e) => {
              const res = await fetch(e.data.value);
              const loadedData = await res.json();
              setItemValue("data", new Data(loadedData));
            }}
          />
        )}
        {data && <DataTable data={data} />}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataLoading };
export default DataLoading;
