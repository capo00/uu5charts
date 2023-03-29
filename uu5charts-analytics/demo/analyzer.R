# nacteni dat
data = read.csv2("http://localhost:2224/assets/cars.csv", header = T, sep = ";", quote = "\"", dec = ".")
str(data)
library(pastecs)
stat.desc(data)
nrow(data)

# odstraneni prazdnych hodnot
data = na.omit(data)
nrow(data)
sapply(data, class)

# Mahalanobisova vzdalenost - pouze na kvalitativnich datech bez NA hodnot
require(graphics)
getMahalanobis = function(data) {
  distance = mahalanobis(data, 1/(dim(data)[1])*t(data)%*%as.matrix(rep(1, dim(data)[1])), cov(data), inverted = FALSE)
  plot(distance, main = "Squared Mahalanobis distances")
  distance
}

quantitativeData = as.matrix(data[,2:7])
distance = getMahalanobis(quantitativeData)
hist(distance)

outliers = which(distance >= 15.09)

# vylouceni odlehlych pozorovani
cleanData = data[-as.vector(outliers),]
nrow(cleanData)

# test normality
shapiro.test(cleanData$Miles_per_Gallon)
hist(cleanData$Miles_per_Gallon)
shapiro.test(cleanData$Cylinders)
hist(cleanData$Cylinders)
shapiro.test(cleanData$Displacement)
hist(cleanData$Displacement)
shapiro.test(cleanData$Horsepower)
hist(cleanData$Horsepower)
shapiro.test(cleanData$Weight_in_lbs)
hist(cleanData$Weight_in_lbs)
shapiro.test(cleanData$Acceleration)
hist(cleanData$Acceleration)

# test multikolinearity
library(matlib)
getVIFValues <- function(data) {
  data_cor <- cor(data)
  data_cor_inv <- solve(data_cor) # inverzni matice R-1
  VIF <- diag(data_cor_inv) # VIF faktory
  VIF
}

cleanQuantitativeData = as.matrix(cleanData[,2:7])
nrow(cleanQuantitativeData)
vif = getVIFValues(cleanQuantitativeData)
vif

# Regrese
plot(cleanData$Miles_per_Gallon, cleanData$Horsepower)

# lineární
reg1 <- lm(Horsepower~Miles_per_Gallon, data = cleanData)
summary(reg1)
plot(reg1$residuals)
SSR <- sum(resid(reg1)^2)
sigma(reg1)
logLik(reg1)
AIC(reg1)
curve(predict(reg1, data.frame(Miles_per_Gallon=x), type="response"), lwd=5, col="red", add=TRUE)

# kvadratická / polynomiální
reg2 <-lm(Horsepower ~ Miles_per_Gallon + I(Miles_per_Gallon^2), data = cleanData)
summary(reg2)
plot(reg2$residuals)
AIC(reg2)
curve(predict(reg2, data.frame(Miles_per_Gallon=x), type="response"), lwd=5, col="blue", add=TRUE)

# inverzní / hyperbola
reg3 <- lm(Horsepower ~ 1/Miles_per_Gallon, data = cleanData)
summary(reg3)
AIC(reg3)
curve(predict(reg3, data.frame(Miles_per_Gallon=x), type="response"), lwd=5, col="green", add=TRUE)

# logaritmická
reg4 <- lm(Horsepower ~ log(Miles_per_Gallon), data = cleanData) # exp(pred.i)
summary(reg4)
AIC(reg4)
exp(reg4$coef[2])
curve(predict(reg4, data.frame(Miles_per_Gallon=x), type="response"), lwd=5, col="purple", add=TRUE)

# mocninná
reg5 <- lm(log(Horsepower) ~ log(Miles_per_Gallon), data = cleanData) # exp(pred.i)
summary(reg5)
plot(reg5$residuals)
AIC(reg5)
curve(exp(predict(reg5, data.frame(Miles_per_Gallon=x), type="response")), lwd=5, col="pink", add=TRUE)

# exponenciální
reg6 <- lm(log(Horsepower) ~ Miles_per_Gallon, data = cleanData) # exp(pred.i)
summary(reg6)
AIC(reg6)
curve(exp(predict(reg6, data.frame(Miles_per_Gallon=x), type="response")), lwd=5, col="brown", add=TRUE)