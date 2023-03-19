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

outliers = which(dataMh >= 15.09)

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
nrow(cleanKvantitativeData)
vif = getVIFValues(cleanKvantitativeData)

# Regrese
plot(cleanData$Miles_per_Gallon, cleanData$Horsepower)

# lineární
reg1 <- lm(Horsepower~Miles_per_Gallon, data = cleanData)
summary(reg1)
SSR <- sum(resid(reg1)^2)
sigma(reg1)
logLik(reg1)
AIC(reg1)
p <- predict(reg1, interval = "confidence", level = 0.95)
abline(reg1, col = "red")

# kvadratická / polynomiální
reg2 <-lm(Horsepower ~ Miles_per_Gallon + I(Miles_per_Gallon^2), data = cleanData)
summary(reg2)
plot(reg2$residuals)
AIC(reg2)
curve(reg2, col = "blue")

# inverzní / hyperbola
reg3 <- lm(Horsepower ~ 1/Miles_per_Gallon, data = cleanData)
summary(reg3)
AIC(reg3)
abline(reg3, col = "green")

# logaritmická
reg4 <- lm(Horsepower ~ log(Miles_per_Gallon), data = cleanData) # exp(pred.i)
summary(reg4)
AIC(reg4)
exp(reg4$coef[2])
abline(exp(reg4$coef[1]), reg4$coef[2], col = "purple")

# mocninná
reg5 <- lm(log(Horsepower) ~ log(Miles_per_Gallon), data = cleanData) # exp(pred.i)
summary(reg5)
plot(reg5$residuals)
AIC(reg5)
abline(reg5, col = "pink")

# exponenciální
reg6 <- lm(log(Horsepower) ~ Miles_per_Gallon, data = cleanData) # exp(pred.i)
summary(reg6)
AIC(reg6)
abline(reg6, col = "brown")

n-p+1
plot(reg1)

library(forecast) 
f = forecast(reg1, cleanData) 
str(f) 
plot(f) 
summary(f)

fit = auto.arima(diff(AirPassengers)[1:10]) f = forecast(fit,h=10) plot(f)


list(
  linear = c(AIC(reg1), BIC(reg1)),
  polynomial = c(AIC(reg2), BIC(reg2)),
  inverse = c(AIC(reg3), BIC(reg3)),
  logarithmic = c(AIC(reg4), BIC(reg4)),
  power = c(AIC(reg5), BIC(reg5)),
  exponencial = c(AIC(reg6), BIC(reg6))
)
