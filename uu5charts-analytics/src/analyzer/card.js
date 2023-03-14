import Uu5Elements from "uu5g05-elements";
import Config from "../config/config";

function Card(props) {
  const { header, value, valueColorScheme = "building", ...restProps } = props;

  return (
    <Uu5Elements.Box
      aspectRatio="1x1"
      size="s"
      borderRadius="moderate"
      className={Config.Css.css({
        display: "inline-flex",
        gap: 16,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      })}
      {...restProps}
    >
      <Uu5Elements.Text category="interface" segment="title" type="minor" colorScheme="dim" significance="subdued">
        {header}
      </Uu5Elements.Text>
      <Uu5Elements.Text category="interface" segment="title" type="main" colorScheme={valueColorScheme}>
        {value}
      </Uu5Elements.Text>
    </Uu5Elements.Box>
  );
}

export default Card;
