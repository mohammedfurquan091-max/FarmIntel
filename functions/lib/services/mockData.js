"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGRI_INPUTS = exports.GOV_SCHEMES = exports.MANDIS = exports.CROPS_META = void 0;
exports.generatePriceSeries = generatePriceSeries;
exports.CROPS_META = {
    wheat: { basePrice: 22.75, volatility: 1.1, seasonal: 1.2, maturityDays: 120 },
    rice: { basePrice: 21.83, volatility: 1.3, seasonal: 1.5, maturityDays: 140 },
    maize: { basePrice: 20.90, volatility: 1.4, seasonal: 1.8, maturityDays: 100 },
    tomato: { basePrice: 35.00, volatility: 5.0, seasonal: 8.0, maturityDays: 70 },
    onion: { basePrice: 32.00, volatility: 4.5, seasonal: 6.0, maturityDays: 110 },
    cotton: { basePrice: 66.20, volatility: 2.0, seasonal: 3.0, maturityDays: 160 },
    chili: { basePrice: 190.00, volatility: 4.0, seasonal: 7.0, maturityDays: 150 },
};
exports.MANDIS = [
    { id: "ludhiana", name: "Ludhiana", state: "Punjab", distanceKm: 12 },
    { id: "amritsar", name: "Amritsar", state: "Punjab", distanceKm: 38 },
    { id: "delhi-azadpur", name: "Azadpur", state: "Delhi", distanceKm: 95 },
    { id: "bowenpally", name: "Bowenpally", state: "Telangana", distanceKm: 15 },
    { id: "guntur", name: "Guntur", state: "Andhra Pradesh", distanceKm: 240 },
    { id: "warangal", name: "Warangal", state: "Telangana", distanceKm: 145 },
];
exports.GOV_SCHEMES = [
    {
        name: "PM-KISAN",
        eligibility: { maxLandAcres: 5 },
        benefits: "₹6,000 per year in three installments",
        documents: ["Aadhaar", "Land Records", "Bank Passbook"]
    },
    {
        name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        eligibility: { crops: ["wheat", "rice", "maize", "cotton"] },
        benefits: "Crop insurance for localized calamities",
        documents: ["Land Possession Certificate", "Sowing Certificate"]
    },
    {
        name: "Kisan Credit Card (KCC)",
        eligibility: {},
        benefits: "Low-interest loans for crop production",
        documents: ["Identity Proof", "Address Proof", "Land Details"]
    }
];
exports.AGRI_INPUTS = {
    fertilizer: { urea: 50, dap: 75, potash: 40 },
    pesticide: { neem_oil: 5, chlorpyrifos: 1.5 }
};
function seeded(seed) {
    let s = seed % 2147483647;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function seedFor(crop, mandiId) {
    let h = 7;
    for (const ch of crop + mandiId)
        h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
}
function generatePriceSeries(crop, region, historyDays = 30, forecastDays = 7) {
    const meta = exports.CROPS_META[crop] || exports.CROPS_META.tomato;
    const mandi = exports.MANDIS.find((m) => m.id === region) || exports.MANDIS[0];
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
        });
    }
    return { points, mandi };
}
//# sourceMappingURL=mockData.js.map