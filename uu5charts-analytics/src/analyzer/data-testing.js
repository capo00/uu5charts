//@@viewOn:imports
import { createVisualComponent, PropTypes, useMemo, useScreenSize, useState, useValueChange } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import Histogram from "../charts/histogram";
import vif from "../model/vif";
import withControlledInput from "./with-controlled-input";
import withData from "./with-data";
import Data from "../model/data";
//@@viewOff:imports

const ControlledNumber = withControlledInput(Uu5Forms.Number);

const ALPHA = 0.05;

function Item(props) {
  const { name, passed, onSelect, selected, children, size, ...restProps } = props;

  return (
    <Uu5Elements.MenuItem
      {...restProps}
      {...(selected ? { significance: "distinct", colorScheme: "primary" } : null)}
      onClick={onSelect}
      size={size === "l" ? "xl" : "l"}
    >
      <Uu5Elements.InfoItem
        title={name}
        subtitle={children}
        icon={passed == null ? "mdi-minus" : passed ? "mdi-check" : "mdi-alert-circle-outline"}
        colorScheme={passed == null ? "dim" : passed ? "positive" : "negative"}
        significance={passed == null ? "subdued" : "highlighted"}
        size={size}
      />
    </Uu5Elements.MenuItem>
  );
}

function NormalityBlock(props) {
  const { data, ...blockProps } = props;

  const [screenSize] = useScreenSize();
  const isSmall = ["xs", "s"].includes(screenSize);

  const keys = data.getQuantitativeKeys();

  const [alpha, setAlpha] = useState(ALPHA);
  const [key, setKey] = useState(keys[0]);

  const keyList = keys.map((key) => {
    const { pValue, ...rest } = data.values(key).shapiroWilk();
    return { name: key, pValue, ...rest, isNormalized: pValue > alpha };
  });

  return (
    <Uu5Elements.Block
      headerType="heading"
      header="Normalita"
      info="Hladina významnosti pro Shapiro-Wilkův test normality. Pokud je p-value testu větší než hladina významnosti, pak jsou data normálně rozdělena. Pokud se histogram přibližuje Gaussovu rozložení, tak se proměnná přibližuje normálnímu rozdělení."
      initialDisplayInfo
      {...blockProps}
    >
      <ControlledNumber
        label={{ cs: "Hladina významnosti" }}
        value={alpha}
        min={0}
        max={1}
        step={0.01}
        onBlur={(e) => setAlpha(e.data.value)}
      />

      <Uu5Elements.Grid
        templateColumns={{ xs: "1fr", m: "max-content 1fr" }}
        className={Config.Css.css({ marginTop: 16 })}
      >
        <div
          className={Config.Css.css({
            width: isSmall ? "100%" : "max-content",
            ...(isSmall
              ? null
              : {
                  paddingRight: 8,
                  borderRight: "1px solid grey",
                }),
            display: "flex",
            flexDirection: "column",
            gap: 4,
          })}
        >
          {keyList.map(({ name, pValue, W, isNormalized }) => (
            <Item
              key={name}
              size="l"
              name={name}
              passed={isNormalized}
              selected={name === key}
              onSelect={() => setKey(name)}
              elementAttrs={{ title: (isNormalized ? "Je" : "Není") + " normalita dat" }}
            >
              {`W = ${Math.round(W * 100) / 100}, pValue = ${pValue}`}
            </Item>
          ))}
        </div>
        <Histogram data={data} valueAxis={{ dataKey: key }} labelAxis={{ title: key }} height={300} />
      </Uu5Elements.Grid>
    </Uu5Elements.Block>
  );
}

function MulticollinearityBlock(props) {
  const { data, keys = data.getQuantitativeKeys(), onKeysChange, ...blockProps } = props;

  const [screenSize] = useScreenSize();
  const isSmall = ["xs", "s"].includes(screenSize);

  const [keyList, setKeyList] = useValueChange(keys, onKeysChange);

  const vifData = useMemo(() => {
    const vifData = keyList.map((key) => data.values(key));
    const vifResult = vif(vifData);

    return Object.fromEntries(keyList.map((k, i) => [k, vifResult[i]]));
  }, [data, keyList]);

  return (
    <Uu5Elements.Block
      headerType="heading"
      header="Multikolinearita"
      info="Pokud je VIF faktor vyšší než 5, jedná se o multikolinearitu dat."
      initialDisplayInfo
      {...blockProps}
    >
      <div
        className={Config.Css.css({
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: isSmall ? "100%" : "max-content",
        })}
      >
        {data.getQuantitativeKeys().map((key) => {
          const selected = keyList.includes(key);
          return (
            <Item
              key={key}
              size="l"
              name={key}
              passed={selected ? vifData[key] <= 5 : undefined}
              selected={selected}
              onSelect={() => {
                const newKeys = [...keyList];
                const i = newKeys.indexOf(key);
                i > -1 ? newKeys.splice(i, 1) : newKeys.push(key);
                setKeyList(newKeys);
              }}
              elementAttrs={{ title: (vifData[key] <= 5 ? "Není" : "Je") + " multikolinearita dat" }}
            >
              {selected ? `VIF = ${vifData[key]}` : undefined}
            </Item>
          );
        })}
      </div>
    </Uu5Elements.Block>
  );
}

const DataTesting = withData(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "DataTesting",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      data: PropTypes.instanceOf(Data).isRequired, // clean data
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { data, ...blockProps } = props;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Uu5Elements.Block headerType="heading" header="Testování předpokladů regrese" level={2} {...blockProps}>
          <NormalityBlock data={data} />
          <MulticollinearityBlock data={data} />
        </Uu5Elements.Block>
      );
      //@@viewOff:render
    },
  })
);

//@@viewOn:helpers
//@@viewOff:helpers

export { DataTesting };
export default DataTesting;
