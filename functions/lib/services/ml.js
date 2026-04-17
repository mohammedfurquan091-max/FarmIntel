"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictNext7Days = predictNext7Days;
exports.getTrendStatus = getTrendStatus;
function predictNext7Days(history) {
    if (history.length < 2)
        return history.slice(-1);
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        const x = i;
        const y = history[i].price;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    const lastDate = new Date(history[n - 1].date);
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i);
        const predictedY = m * (n - 1 + i) + b;
        const confidence = 0.02 * i;
        forecast.push({
            date: d.toISOString().slice(0, 10),
            price: Number(predictedY.toFixed(2)),
            isForecast: true,
            lower: Number((predictedY * (1 - confidence)).toFixed(2)),
            upper: Number((predictedY * (1 + confidence)).toFixed(2)),
        });
    }
    return forecast;
}
function getTrendStatus(history, forecast) {
    if (!history.length || !forecast.length)
        return 'STABLE';
    const startPrice = history[0].price;
    const endPrice = forecast[6].price;
    const diff = ((endPrice - startPrice) / startPrice) * 100;
    if (diff > 5)
        return 'UP';
    if (diff < -5)
        return 'DOWN';
    return 'STABLE';
}
//# sourceMappingURL=ml.js.map