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
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    category: "Income Support",
    status: "Active",
    benefit: "₹6,000/year",
    benefitDetail: "Paid in 3 installments of ₹2,000 directly to bank account",
    eligibility: ["All landholding farmers", "Small and marginal farmers", "Indian citizen with valid Aadhaar"],
    exclusions: ["Income tax payers", "Former/current ministers, MPs, MLAs", "Government employees"],
    documents: ["Aadhaar Card", "Land Records (Khatauni)", "Bank Passbook", "Mobile Number linked to Aadhaar"],
    deadline: "Ongoing – Register anytime",
    applyUrl: "https://pmkisan.gov.in",
    color: "green",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "pmfby",
    name: "PMFBY",
    fullName: "Pradhan Mantri Fasal Bima Yojana",
    category: "Crop Insurance",
    status: "Active",
    benefit: "Up to full sum insured",
    benefitDetail: "Premium: 2% for Kharif, 1.5% for Rabi, 5% for horticulture crops",
    eligibility: ["All farmers growing notified crops", "Loanee and non-loanee farmers", "Tenant and sharecroppers"],
    exclusions: ["Crops not notified under the scheme in that district"],
    documents: ["Aadhaar Card", "Land Record / Patta", "Bank Account Details", "Sowing Certificate", "Crop Declaration Form"],
    deadline: "Kharif: 31 July | Rabi: 31 December",
    applyUrl: "https://pmfby.gov.in",
    color: "blue",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "kcc",
    name: "KCC",
    fullName: "Kisan Credit Card",
    category: "Agricultural Credit",
    status: "Active",
    benefit: "Loan up to ₹3 lakh at 4% interest",
    benefitDetail: "Short-term credit for crop cultivation, post-harvest expenses and allied activities",
    eligibility: ["Farmers — individual or joint borrowers", "Owner-cultivators", "Tenant farmers, oral lessees"],
    exclusions: ["Non-agricultural borrowers"],
    documents: ["Identity Proof (Aadhaar/PAN)", "Address Proof", "Land details / lease agreement", "Passport size photo"],
    deadline: "Ongoing – Apply at any bank branch",
    applyUrl: "https://www.nabard.org/content.aspx?id=572",
    color: "amber",
    ministry: "Ministry of Finance / NABARD"
  },
  {
    id: "pkvy",
    name: "PKVY",
    fullName: "Paramparagat Krishi Vikas Yojana",
    category: "Organic Farming",
    status: "Active",
    benefit: "₹50,000/hectare over 3 years",
    benefitDetail: "Supports organic farming clusters, certification and marketing of organic produce",
    eligibility: ["Farmers willing to adopt organic farming", "Groups of minimum 20 farmers", "Land under cluster must be contiguous"],
    exclusions: ["Individual applications (must form a cluster)"],
    documents: ["Aadhaar Card", "Land Records", "Bank Details", "Group formation certificate"],
    deadline: "Subject to state announcement",
    applyUrl: "https://pgsindia-ncof.gov.in",
    color: "lime",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "pm-kisan-maandhan",
    name: "PM-KMY",
    fullName: "Pradhan Mantri Kisan Maandhan Yojana",
    category: "Pension Scheme",
    status: "Active",
    benefit: "₹3,000/month pension after age 60",
    benefitDetail: "Voluntary & contributory pension with matching contribution by Government of India",
    eligibility: ["Small and marginal farmers", "Age 18–40 years", "Land holding up to 2 hectares"],
    exclusions: ["NPS, ESIC, EPFO members", "Existing PM-SYM members", "Income tax payers"],
    documents: ["Aadhaar Card", "Bank Account (linked to Aadhaar)", "Land Record"],
    deadline: "Enroll at nearest CSC / PM-KISAN portal",
    applyUrl: "https://maandhan.in",
    color: "purple",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "enam",
    name: "e-NAM",
    fullName: "Electronic National Agriculture Market",
    category: "Market Access",
    status: "Active",
    benefit: "Online pan-India market access",
    benefitDetail: "Sell produce directly to buyers across India via transparent online bidding",
    eligibility: ["All farmers registered at APMC mandis"],
    exclusions: ["Mandis not integrated with e-NAM platform"],
    documents: ["Aadhaar Card", "Bank Account", "Registration at local APMC mandi"],
    deadline: "Ongoing – Register at nearest mandi",
    applyUrl: "https://enam.gov.in",
    color: "teal",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "aif",
    name: "AIF",
    fullName: "Agriculture Infrastructure Fund",
    category: "Infrastructure Loan",
    status: "Active",
    benefit: "Loans up to ₹2 Crore at 3% interest subsidy",
    benefitDetail: "For post-harvest management infrastructure, cold storage, primary processing",
    eligibility: ["FPOs, FPCs", "Agri-entrepreneurs", "SHGs, Primary Agricultural Credit Societies"],
    exclusions: ["Retail trading not eligible"],
    documents: ["Business Plan", "Registration Certificate", "Financial Statements", "Bank Details"],
    deadline: "Ongoing",
    applyUrl: "https://agriinfra.dac.gov.in",
    color: "orange",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "rkvy",
    name: "RKVY",
    fullName: "Rashtriya Krishi Vikas Yojana",
    category: "Development Grant",
    status: "Active",
    benefit: "Grants for agri development projects",
    benefitDetail: "State-level agricultural development including infrastructure, R&D, and farmer training",
    eligibility: ["Farmers registered under state agriculture department"],
    exclusions: ["Varies by state"],
    documents: ["Aadhaar Card", "Bank Account", "Land Records", "Application via state portals"],
    deadline: "Varies by state scheme",
    applyUrl: "https://rkvy.nic.in",
    color: "indigo",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
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
