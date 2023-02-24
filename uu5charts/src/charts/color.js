import { UuGds } from "uu5g05-elements";

const gdsColors = UuGds.getValue(["ColorPalette", "basic"]);

const COLOR_LIST = ["blue", "purple"];
const SHADE_LIST = [
  "softSolidDark",
  "softStrongerSolidDark",
  "softStrongestSolidDark",
  "mainDarkest",
  "mainDarker",
  "main",
  "mainLighter",
  "mainLightest",
  "softStrongestSolidLight",
  "softStrongerSolidLight",
  "softSolidLight",
];

const colorListReversed = [...COLOR_LIST].reverse();
const shadeListReversed = [...SHADE_LIST].reverse();

const Color = {
  generateColors(length, reverse = false) {
    const colors = [];
    let colorList = reverse ? colorListReversed : COLOR_LIST;
    let shadeList = SHADE_LIST;

    if (length < SHADE_LIST.length) {
      const shadeFromIndex = Math.floor(shadeList.length / 2 - length / 2);

      colorList = [colorList[0]];
      shadeList = SHADE_LIST.slice(shadeFromIndex, shadeFromIndex + length);
    }

    for (let i in colorList) {
      const color = colorList[i];
      const shades = i % 2 === 0 ? shadeList : shadeListReversed;
      for (let key of shades) {
        colors.push(gdsColors[color][key]);
        if (colors.length >= length) break;
      }
      if (colors.length >= length) break;
    }

    return colors;
  },

  getColor(color, colorList) {
    return gdsColors[color]?.main || color || colorList?.shift();
  },
};

export default Color;
