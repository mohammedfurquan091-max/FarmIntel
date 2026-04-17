export const CROPS_META: any = {
  wheat: { basePrice: 22.75, volatility: 1.1, seasonal: 1.2 }, // MSP 2024-25
  rice: { basePrice: 21.83, volatility: 1.3, seasonal: 1.5 },  // MSP Grade A
  maize: { basePrice: 20.90, volatility: 1.4, seasonal: 1.8 }, // MSP
  tomato: { basePrice: 35.00, volatility: 5.0, seasonal: 8.0 }, // Market average
  onion: { basePrice: 32.00, volatility: 4.5, seasonal: 6.0 },  // Market average
  cotton: { basePrice: 66.20, volatility: 2.0, seasonal: 3.0 }, // MSP
  chili: { basePrice: 190.00, volatility: 4.0, seasonal: 7.0 }, // Market average
};

export const MANDIS = [
  { id: "ludhiana", name: "Ludhiana", state: "Punjab", distanceKm: 12 },
  { id: "amritsar", name: "Amritsar", state: "Punjab", distanceKm: 38 },
  { id: "delhi-azadpur", name: "Azadpur", state: "Delhi", distanceKm: 95 },
  { id: "bowenpally", name: "Bowenpally", state: "Telangana", distanceKm: 15 },
  { id: "guntur", name: "Guntur", state: "Andhra Pradesh", distanceKm: 240 },
  { id: "warangal", name: "Warangal", state: "Telangana", distanceKm: 145 },
];

function seeded(seed: number) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function seedFor(crop: string, mandiId: string) {
  let h = 7;
  for (const ch of crop + mandiId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function generatePriceSeries(crop: string, region: string, historyDays = 30, forecastDays = 7) {
  const meta = CROPS_META[crop] || CROPS_META.tomato;
  const mandi = MANDIS.find((m) => m.id === region) || MANDIS[0];
  const rand = seeded(seedFor(crop, region));
  const mandiBias = (mandi.distanceKm % 7) - 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const points = [];
  let price = meta.basePrice + mandiBias;

  for (let i = -historyDays; i <= forecastDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const seasonal = Math.sin((i / 30) * Math.PI) * meta.seasonal;
    const drift = (rand() - 0.5) * meta.volatility;
    price = Math.max(8, price + drift * 0.4 + seasonal * 0.05);
    const value = Number((meta.basePrice + mandiBias + seasonal + (price - meta.basePrice) * 0.6).toFixed(2));
    const isForecast = i > 0;
    
    points.push({
      date: d.toISOString().slice(0, 10),
      price: value,
      isForecast,
      lower: isForecast ? Number((value * 0.92).toFixed(2)) : undefined,
      upper: isForecast ? Number((value * 1.08).toFixed(2)) : undefined,
    });
  }
  return { points, mandi };
}
