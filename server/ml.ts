export interface PricePoint { date: string; price: number; }

export function predictNext7Days(history: PricePoint[]) {
  if (history.length < 2) return history.slice(-1);
  const n = history.length;
  let sumX=0, sumY=0, sumXY=0, sumXX=0;
  for (let i=0;i<n;i++) { sumX+=i; sumY+=history[i].price; sumXY+=i*history[i].price; sumXX+=i*i; }
  const m = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
  const b = (sumY - m*sumX) / n;
  const lastDate = new Date(history[n-1].date);
  return Array.from({length:7},(_,i)=>{
    const d=new Date(lastDate); d.setDate(d.getDate()+i+1);
    const y = m*(n-1+i+1)+b;
    const c = 0.02*(i+1);
    return { date:d.toISOString().slice(0,10), price:Number(y.toFixed(2)), isForecast:true, lower:Number((y*(1-c)).toFixed(2)), upper:Number((y*(1+c)).toFixed(2)) };
  });
}

export function getTrendStatus(history: PricePoint[], forecast: any[]) {
  if (!history.length || !forecast.length) return 'STABLE';
  const diff = ((forecast[6].price - history[0].price) / history[0].price)*100;
  return diff > 5 ? 'UP' : diff < -5 ? 'DOWN' : 'STABLE';
}
