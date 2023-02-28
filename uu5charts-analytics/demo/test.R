# set url to cdn
data = read.csv2("http://localhost:2224/assets/cars.csv", header = T, sep = ";", quote = "\"", dec = ".")
str(data)
stat.desc(data)
nrow(data)

data = na.omit(data)
stat.desc(data)
nrow(data)

kvantitativeData = as.matrix(data[,2:7])

# Mahalanobisova vzdálenost - pouze na kvalitativních datech bez NA hodnot -> data = na.omit(data)
require(graphics)
getMahalanobis = function(data) {
  distance = mahalanobis(data, 1/(dim(data)[1])*t(data)%*%as.matrix(rep(1, dim(data)[1])), cov(data), inverted = FALSE)
  plot(distance, main = "Squared Mahalanobis distances")
  distance
}
dataMh = getMahalanobis(kvantitativeData)

outliers = which(dataMh > 18.42)

# vylouceni odlehlych pozorovani
cleanData = data[-as.vector(outliers),]
nrow(cleanData)
