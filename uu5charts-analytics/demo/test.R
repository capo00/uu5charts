# set url to cdn
data = read.csv2("http://localhost:2224/assets/cars.csv", header = T, sep = ";", quote = "\"", dec = ".")
str(data)
stat.desc(data)
nrow(data)

data = na.omit(data)
stat.desc(data)
nrow(data)
sapply(data,class)

kvantitativeData = as.matrix(data[,2:7])

# Mahalanobisova vzdálenost - pouze na kvalitativních datech bez NA hodnot -> data = na.omit(data)
require(graphics)
getMahalanobis = function(data) {
  distance = mahalanobis(data, 1/(dim(data)[1])*t(data)%*%as.matrix(rep(1, dim(data)[1])), cov(data), inverted = FALSE)
  plot(distance, main = "Squared Mahalanobis distances")
  distance
}
dataMh = getMahalanobis(kvantitativeData)

outliers = which(dataMh >= 16.81)

# vylouceni odlehlych pozorovani
cleanData = data[-as.vector(outliers),]
nrow(cleanData)

#### Multikolinearita ####
library(matlib)
getVIFValues <- function(data) {
  data_cor <- cor(data)
  data_cor_inv <- solve(data_cor) # inverzni matice R-1
  VIF <- diag(data_cor_inv) # VIF faktory
  #nums <- which(VIF > 5)
  #cbind(name = colnames(data)[nums], order = nums)
  VIF
}

cleanKvantitativeData = as.matrix(cleanData[,2:7])
vif = getVIFValues(cleanKvantitativeData)

# Regrese
reg1 <- lm(Miles_per_Gallon~Horsepower, data = cleanData)
summary(reg1)

reg2 <-lm(Miles_per_Gallon ~ Horsepower + I(Horsepower^2), data = cleanData)
summary(reg2)

reg3 <- lm(log(Miles_per_Gallon) ~ log(Horsepower), data = cleanData) # exp(pred.i)
summary(reg3)
n-p+1
plot(reg1)

library(forecast) 
f= forecast(fit, mtcars) 
str(odhad) 
plot(f) 

fit = auto.arima(diff(AirPassengers)[1:10]) f = forecast(fit,h=10) plot(f)
