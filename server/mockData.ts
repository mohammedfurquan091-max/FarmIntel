export const CROPS_META: any = {
  wheat:  { basePrice: 22.75, volatility: 1.1, seasonal: 1.2, maturityDays: 120 },
  rice:   { basePrice: 21.83, volatility: 1.3, seasonal: 1.5, maturityDays: 140 },
  maize:  { basePrice: 20.90, volatility: 1.4, seasonal: 1.8, maturityDays: 100 },
  tomato: { basePrice: 35.00, volatility: 5.0, seasonal: 8.0, maturityDays: 70  },
  onion:  { basePrice: 32.00, volatility: 4.5, seasonal: 6.0, maturityDays: 110 },
  cotton: { basePrice: 66.20, volatility: 2.0, seasonal: 3.0, maturityDays: 160 },
  chili:  { basePrice: 190.00, volatility: 4.0, seasonal: 7.0, maturityDays: 150 },
};

export const MANDIS = [
  { id: 'ludhiana',     name: 'Ludhiana',    state: 'Punjab',          distanceKm: 12  },
  { id: 'amritsar',     name: 'Amritsar',    state: 'Punjab',          distanceKm: 38  },
  { id: 'delhi-azadpur',name: 'Azadpur',     state: 'Delhi',           distanceKm: 95  },
  { id: 'bowenpally',   name: 'Bowenpally',  state: 'Telangana',       distanceKm: 15  },
  { id: 'guntur',       name: 'Guntur',      state: 'Andhra Pradesh',  distanceKm: 240 },
  { id: 'warangal',     name: 'Warangal',    state: 'Telangana',       distanceKm: 145 },
];

export const GOV_SCHEMES = [
  { name: 'PM-KISAN', eligibility: { maxLandAcres: 5 }, benefits: '₹6,000/year in three installments', documents: ['Aadhaar', 'Land Records', 'Bank Passbook'] },
  { name: 'PM Fasal Bima Yojana (PMFBY)', eligibility: { crops: ['wheat','rice','maize','cotton'] }, benefits: 'Crop insurance for localized calamities', documents: ['Land Possession Certificate'] },
  { name: 'Kisan Credit Card (KCC)', eligibility: {}, benefits: 'Low-interest loans for crop production', documents: ['Identity Proof', 'Land Details'] },
];

export const AGRI_INPUTS: any = {
  fertilizer: { urea: 50, dap: 75, potash: 40 },
  pesticide:  { neem_oil: 5, chlorpyrifos: 1.5 },
};

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
  const mandi = MANDIS.find(m => m.id === region) || MANDIS[0];
  const rand = seeded(seedFor(crop, region));
  const mandiBias = (mandi.distanceKm % 7) - 3;
  const today = new Date(); today.setHours(0,0,0,0);
  const points: any[] = [];
  let price = meta.basePrice + mandiBias;
  for (let i = -historyDays; i <= forecastDays; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const seasonal = Math.sin((i/30)*Math.PI) * meta.seasonal;
    const drift = (rand()-0.5) * meta.volatility;
    price = Math.max(8, price + drift*0.4 + seasonal*0.05);
    const value = Number((meta.basePrice + mandiBias + seasonal + (price-meta.basePrice)*0.6).toFixed(2));
    points.push({ date: d.toISOString().slice(0,10), price: value, isForecast: i>0 });
  }
  return { points, mandi };
}
