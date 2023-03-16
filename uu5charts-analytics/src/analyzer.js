//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "./config/config.js";
import DataLoading from "./analyzer/data-loading";
import DataAnalysis from "./analyzer/data-analysis";
import DataTesting from "./analyzer/data-testing";
import DataRegression from "./analyzer/data-regression";
import DataPrediction from "./analyzer/data-prediction";
import Data from "./model/data";

//@@viewOff:imports

const STEP_LIST = [
  {
    title: "Načtení",
    component: () => {
      const { value, setItemValue } = useFormApi();

      return <DataLoading data={value.data} onChange={(e) => setItemValue("data", e.data.data)} />;
    },
  },
  {
    component: DataAnalysis,
    title: "Analýza",
  },
  {
    component: DataTesting,
    title: "Test",
  },
  {
    component: DataRegression,
    title: "Regrese",
  },
  {
    component: DataPrediction,
    title: "Predikce",
  },
];

const Analyzer = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Analyzer",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data } = props;

    async function handleSubmit(e) {
      // TODO something return to user?
      console.log("Submitting data: ", e.data.value);
    }

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Forms.Form.Provider
        onSubmit={handleSubmit}
        preserveValueOnUnmount
        initialValue={{ data: data ? new Data(data) : undefined }}
      >
        <Uu5Forms.Wizard.Provider itemList={STEP_LIST}>
          <Uu5Forms.Wizard.Stepper />
          <Uu5Forms.Wizard.Content />
          <div style={{ display: "flex", justifyContent: "end", gap: 8, marginTop: 24 }}>
            <Uu5Forms.Wizard.PreviousButton />
            <Uu5Forms.Wizard.SubmitButton />
          </div>
        </Uu5Forms.Wizard.Provider>
      </Uu5Forms.Form.Provider>
    );
    //@@viewOff:render
  },
});

Analyzer.DataLoading = DataLoading;

//@@viewOn:helpers
//@@viewOff:helpers

export { Analyzer };
export default Analyzer;
