import { ResponsiveLine, Line } from "@nivo/line";
import Config from "../config/config";

function convertDataToNivo(data, series, labelAxis) {
  return series.map((serie, i) => {
    const { valueKey, color, title } = serie;

    return {
      id: title || valueKey,
      color,
      data: data.map((item) => ({
        x: item[labelAxis.dataKey],
        y: item[valueKey],
      })),
    };
  });
}

function NivoLine(props) {
  let {
    data,
    series, // TODO
    labelAxis = {},
    valueAxis = {},
    legend = false, // TODO
    tooltip, // TODO
    displayCartesianGrid = false,
    lines, // TODO
    width = 500,
    height = 300,
  } = props;

  const dataToRender = convertDataToNivo(data, series, labelAxis, valueAxis);

  return (
    <Line
      data={dataToRender}
      width={width}
      height={height}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        // stacked: true,
        // reverse: false,
      }}
      yFormat=" >-.2f"
      enableGridX={displayCartesianGrid}
      enableGridY={displayCartesianGrid}
      axisTop={null}
      axisRight={null}
      colors={{ datum: 'color' }}
      axisBottom={{
        orient: "bottom",
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: labelAxis.title,
        legendOffset: 36,
        legendPosition: "middle",
        format: labelAxis.unit ? (value) => value + labelAxis.unit : undefined,
      }}
      axisLeft={{
        orient: "left",
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: valueAxis.title,
        legendOffset: -40,
        legendPosition: "middle",
        format: valueAxis.unit ? (value) => value + valueAxis.unit : undefined,
      }}
      // pointSize={10}
      // pointColor={{ theme: "background" }}
      // pointBorderWidth={2}
      // pointBorderColor={{ from: "serieColor" }}
      // pointLabelYOffset={-12}
      useMesh
      enablePoints={false}
      legends={legend ? [
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ] : undefined}
      // enableSlices="x"
      // sliceTooltip={(...args) => {
      //   console.log(args);
      //   const { slice } = args[0];
      //   return (
      //     <div
      //       style={{
      //         background: "white",
      //         padding: "9px 12px",
      //         border: "1px solid #ccc",
      //       }}
      //     >
      //       <div>x: {slice.id}</div>
      //       {slice.points.map((point) => (
      //         <div
      //           key={point.id}
      //           style={{
      //             color: point.serieColor,
      //             padding: "3px 0",
      //           }}
      //         >
      //           <strong>{point.serieId}</strong> [{point.data.yFormatted}]
      //         </div>
      //       ))}
      //     </div>
      //   );
      // }}
    />
  );
}

export default NivoLine;
