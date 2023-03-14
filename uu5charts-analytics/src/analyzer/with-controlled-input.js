import { createComponent, useState, Utils } from "uu5g05";

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

export { withControlledInput };
export default withControlledInput;
