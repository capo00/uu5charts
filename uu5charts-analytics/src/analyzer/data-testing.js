//@@viewOn:imports
import { createComponent, createVisualComponent, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import Histogram from "../charts/histogram";

//@@viewOff:imports

function withControlledInput(Component) {
  return createComponent({
    uu5Tag: `withControlledInput(${Component.uu5Tag || "noname"})`,

    render({ onChange, onBlur, ...props }) {
      const [value, setValue] = useState(props.value);

      return (
        <Component
          {...props}
          value={value}
          onChange={(e) => {
            setValue(e.data.value);
            typeof onChange === "function" && onChange(e);
          }}
          onBlur={(e) => typeof onBlur === "function" && onBlur(new Utils.Event({ ...e.data, value }, e))}
        />
      );
    },
  });
}

const ControlledNumber = withControlledInput(Uu5Forms.Number);

const ALPHA = 0.05;

function NormalityBlock(props) {
  const { data, ...blockProps } = props;

  const [alpha, setAlpha] = useState(ALPHA);

  const keys = data.getQuantitativeKeys().map((key) => {
    const { pValue, ...rest } = data.values(key).shapiroWilk();
    return { key, pValue, ...rest, diff: alpha - pValue };
  });

  return (
    <Uu5Elements.Block headerType="heading" level={3} header="Normalita" collapsible {...blockProps}>
      <ControlledNumber
        label={{ cs: "Hladina významnosti" }}
        value={alpha}
        min={0}
        max={1}
        step={0.01}
        onBlur={(e) => setAlpha(e.data.value)}
      />

      {keys
        .sort(({ diff: a }, { diff: b }) => a - b)
        .map(({ key, W, pValue }) => (
          <Uu5Elements.Block
            key={key}
            collapsible
            initialCollapsed
            headerType="heading"
            header={
              <>
                {key}{" "}
                <Uu5Elements.Badge
                  icon={pValue > alpha ? "mdi-check" : "mdi-alert-circle-outline"}
                  colorScheme={pValue > alpha ? "positive" : "negative"}
                  borderRadius="full"
                  tooltip={`p-value = ${pValue}`}
                />
              </>
            }
            info={
              <>
                W: {W}
                <br />
                p-value: {pValue}
              </>
            }
          >
            <Histogram data={data} valueAxis={{ dataKey: key }} />
          </Uu5Elements.Block>
        ))}
    </Uu5Elements.Block>
  );
}

const DataTesting = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataTesting",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value } = useFormApi();
    const { cleanData: data } = value;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render

    // unmount of data-analysis is later than mount of this component -> data is not here for first render
    return (
      data && (
        <div>
          <NormalityBlock data={data} />

          <Uu5Elements.Block headerType="heading" level={3} header="Multikolinearita" collapsible initialCollapsed>
            TODO
          </Uu5Elements.Block>

          <Uu5Elements.Block headerType="heading" level={3} header="Autokorelace" collapsible initialCollapsed>
            TODO
          </Uu5Elements.Block>

          <Uu5Elements.Block headerType="heading" level={3} header="Heteroskedasticita" collapsible initialCollapsed>
            TODO
          </Uu5Elements.Block>
        </div>
      )
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DataTesting };
export default DataTesting;
