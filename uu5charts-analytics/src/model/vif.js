import { invert, cor } from "./mahalanobis/matrix";

function vif(data) {
  const corData = cor(data);
  const invData = invert(corData);

  const dialogData = [];
  for (let i = 0; i < invData.length; i++) {
    dialogData[i] = invData[i][i];
  }

  return dialogData;
}

export { vif };
export default vif;
