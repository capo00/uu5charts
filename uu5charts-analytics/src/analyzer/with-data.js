import { createComponent } from "uu5g05";
import Data from "../model/data";

function withData(Component) {
  return createComponent({
    uu5Tag: `withData(${Component.uu5Tag || "noname"})`,

    render({ data, ...props }) {
      if (data && !(data instanceof Data)) {
        data = new Data(data);
      }

      return <Component data={data} {...props} />;
    },
  });
}

export { withData };
export default withData;
