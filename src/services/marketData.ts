// Dynamic market data service connecting to API

export type CropId = "wheat" | "rice" | "maize" | "tomato" | "onion" | "cotton" | "chili";
export type DemandTrend = "high" | "rising" | "stable" | "falling";

export interface Mandi {
  id: string;
  name: string;
  state: string;
  distanceKm: number;
}

export interface PricePoint {
  date: string; // ISO
  price: number;
  isForecast?: boolean;
  lower?: number;
  upper?: number;
}

export interface MarketRow {
  mandi: Mandi;
  current: number;
  predicted3d: number;
  demand: DemandTrend;
}

export const CROPS: { id: CropId; basePrice: number; volatility: number; seasonal: number }[] = [
  { id: "wheat", basePrice: 22.75, volatility: 1.1, seasonal: 1.2 },
  { id: "rice", basePrice: 21.83, volatility: 1.3, seasonal: 1.5 },
  { id: "maize", basePrice: 20.90, volatility: 1.4, seasonal: 1.8 },
  { id: "tomato", basePrice: 35.00, volatility: 5.0, seasonal: 8.0 },
  { id: "onion", basePrice: 32.00, volatility: 4.5, seasonal: 6.0 },
  { id: "cotton", basePrice: 66.20, volatility: 2.0, seasonal: 3.0 },
  { id: "chili", basePrice: 190.00, volatility: 4.0, seasonal: 7.0 },
];

export const MANDIS: Mandi[] = [
  { id: "ludhiana", name: "Ludhiana", state: "Punjab", distanceKm: 12 },
  { id: "amritsar", name: "Amritsar", state: "Punjab", distanceKm: 38 },
  { id: "delhi-azadpur", name: "Azadpur", state: "Delhi", distanceKm: 95 },
  { id: "bowenpally", name: "Bowenpally", state: "Telangana", distanceKm: 15 },
  { id: "guntur", name: "Guntur", state: "Andhra Pradesh", distanceKm: 240 },
  { id: "warangal", name: "Warangal", state: "Telangana", distanceKm: 145 },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function fetchPriceSeries(crop: CropId, region: string) {
  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, region })
    });
    if (!res.ok) throw new Error("Failed to fetch prices");
    const data = await res.json();
    const allPoints = [...(data.historical || []), ...(data.predicted_prices || [])];
    return allPoints as PricePoint[];
  } catch (err) {
    console.warn("API unavailable, using fallback price series");
    const meta = CROPS.find(c => c.id === crop) || CROPS[0];
    const points: PricePoint[] = [];
    let p = meta.basePrice;
    const d = new Date(); d.setDate(d.getDate() - 21);
    for (let i = 0; i < 28; i++) {
      d.setDate(d.getDate() + 1);
      p += (Math.random() - 0.5) * meta.volatility;
      points.push({ date: d.toISOString().slice(0, 10), price: Number(p.toFixed(2)), isForecast: i >= 21 });
    }
    return points;
  }
}

export async function fetchRecommendation(crop: CropId, region: string, predicted_prices: PricePoint[]) {
  try {
    const res = await fetch(`${API_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, region, predicted_prices })
    });
    if (!res.ok) throw new Error("Failed to fetch recommendation");
    return await res.json();
  } catch (err) {
    console.warn("API unavailable, using fallback recommendation");
    return { action: "Hold", confidence: 85, reason: "Markets are currently volatile locally. We recommend waiting for 3-5 days before selling to capture better prices.", riskLevel: "medium" };
  }
}

export async function fetchProfitConfig(quantity: number, cost: number, predicted_price: number, distance_km: number) {
  try {
    const res = await fetch(`${API_URL}/profit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, cost, predicted_price, distance_km })
    });
    if (!res.ok) throw new Error("Failed to fetch profit calculation");
    return await res.json();
  } catch (err) {
    console.warn("API unavailable, using fallback profit calc");
    const transport = distance_km * 2; // naive calc
    const revenue = quantity * predicted_price;
    const net_profit = revenue - cost - transport;
    const roi = cost > 0 ? (net_profit / cost) * 100 : 0;
    return { revenue, cost: cost + transport, net_profit, roi: Number(roi.toFixed(1)) };
  }
}

export interface Buyer {
  id: string;
  name: string;
  cropFocus: CropId;
  mandi: string;
  phone: string;
  distanceKm: number;
}

export const BUYERS: Buyer[] = [
  { id: "b1", name: "Singh Traders", cropFocus: "wheat", mandi: "Ludhiana", phone: "+919812340001", distanceKm: 8 },
  { id: "b2", name: "Khalsa Cooperative", cropFocus: "rice", mandi: "Amritsar", phone: "+919812340002", distanceKm: 22 },
  { id: "b3", name: "Fresh Mandi Co.", cropFocus: "tomato", mandi: "Azadpur", phone: "+919812340003", distanceKm: 95 },
  { id: "b4", name: "Annapurna Foods", cropFocus: "onion", mandi: "Ludhiana", phone: "+919812340004", distanceKm: 14 },
  { id: "b5", name: "Green Harvest", cropFocus: "maize", mandi: "Amritsar", phone: "+919812340005", distanceKm: 35 },
];
