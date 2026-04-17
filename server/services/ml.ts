export interface PricePoint {
  date: string;
  price: number;
}

/**
 * Perform a Simple Linear Regression (y = mx + b)
 * Returns a 7-day forecast based on the historical trend.
 */
export function predictNext7Days(history: PricePoint[]) {
  if (history.length < 2) return history.slice(-1);

  // x = day index, y = price
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

  // Calculate slope (m) and intercept (b)
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  // Generate 7 days of forecast
  const lastDate = new Date(history[n - 1].date);
  const forecast: { date: string, price: number, isForecast: boolean, lower: number, upper: number }[] = [];

  for (let i = 1; i <= 7; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    
    // Predicted price
    const predictedY = m * (n - 1 + i) + b;
    
    // Trend analysis (simple up/down/stable)
    // We add some conservative confidence intervals
    const confidence = 0.02 * i; // error Grows 2% per day

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

/**
 * Calculate the overall trend status
 */
export function getTrendStatus(history: PricePoint[], forecast: any[]) {
  const startPrice = history[0].price;
  const endPrice = forecast[6].price;
  const diff = ((endPrice - startPrice) / startPrice) * 100;

  if (diff > 5) return 'UP';
  if (diff < -5) return 'DOWN';
  return 'STABLE';
}
