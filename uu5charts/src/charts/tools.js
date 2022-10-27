import { PropTypes } from "uu5g05";

export const propTypes = {
  data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])).isRequired,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      valueKey: PropTypes.string.isRequired,
      title: PropTypes.string, // TODO node?
      type: PropTypes.oneOf(["point", "line", "area", "bar"]),
      color: PropTypes.string,
      labelKey: PropTypes.string, // for Pie and Radar
    })
  ).isRequired,

  labelAxis: PropTypes.shape({
    dataKey: PropTypes.string.isRequired,
    title: PropTypes.string,
    unit: PropTypes.string,
  }).isRequired,
  valueAxis: PropTypes.shape({
    title: PropTypes.string,
    unit: PropTypes.string,
  }),

  legend: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      title: PropTypes.string,
      position: PropTypes.oneOf([
        "top-left", "top-center", "top-right",
        "middle-left", "middle-center", "middle-right",
        "bottom-left", "bottom-center", "bottom-right",
      ]),
      component: PropTypes.func,
    }),
  ]),
  tooltip: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  label: PropTypes.shape({
    position: PropTypes.oneOf(["top", "center", "bottom"]),
    component: PropTypes.func,
  }),

  displayCartesianGrid: PropTypes.bool,
  onClick: PropTypes.func,
};

export const defaultProps = {
  data: [],
  series: [],
  tooltip: true,
};
