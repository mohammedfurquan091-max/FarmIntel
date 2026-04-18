import dotenv from 'dotenv';
import path from 'path';

// Load environment variables IMMEDIATELY
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { generatePriceSeries, MANDIS, CROPS_META, GOV_SCHEMES, AGRI_INPUTS } from './mockData';
import { predictNext7Days, getTrendStatus } from './ml';
import { gemini } from './geminiRotator';   // Now environment is loaded

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── Health ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'farmintel API v3 running',
    port: 3001,
    ai: {
      rotator: 'active',
      totalKeys: gemini.keyCount,
      currentKey: gemini.activeKeyNum,
    }
  });
});

// ── 1. Price Prediction (ML – no AI) ────────────────────────────────────
app.post('/api/predict', (req, res) => {
  const { crop, region } = req.body;
  if (!crop || !region) return res.status(400).json({ error: 'Missing crop or region' });
  const { points } = generatePriceSeries(crop, region, 21, 0);
  const historical = points.filter((p: any) => !p.isForecast);
  const predicted_prices = predictNext7Days(historical);
  const trend = getTrendStatus(historical, predicted_prices);
  res.json({ crop, region, trend, historical, predicted_prices, confidence: 91.2 });
});

// ── 2. Find Best Market (ML – no AI) ────────────────────────────────────
app.post('/api/find-market', (req, res) => {
  const { crop, quantity, transportCostPerKm = 2 } = req.body;
  if (!crop || !quantity) return res.status(400).json({ error: 'Missing crop or quantity' });
  const recs = MANDIS.map(m => {
    const { points } = generatePriceSeries(crop, m.id, 0, 1);
    const price = points[0].price;
    const transport = m.distanceKm * transportCostPerKm;
    const profit = price * quantity - transport;
    return { marketName: m.name, state: m.state, pricePerKg: price, transportCost: transport, expectedProfit: profit, distance: m.distanceKm };
  });
  res.json(recs.sort((a, b) => b.expectedProfit - a.expectedProfit));
});

// ── 3. Gemini Chat ── [ROTATOR] ──────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, crop, region, predicted_prices, language = 'English' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const system = `You are "farmintel AI", a friendly multilingual agricultural expert for Indian farmers. Reply in ${language}. ONLY answer agriculture-related questions (crops, soil, prices, markets, farming). If the question is unrelated, politely say: "I can only assist with agriculture-related queries."`;
    const context = `Crop context: ${crop || 'General'} | Region: ${region || 'India'} | 7-Day Price Forecast (₹/kg): ${JSON.stringify(predicted_prices || [])}`;
    const text = await gemini.generateContent([system, context, `Farmer asks: ${message}`]);
    res.json({ text, servedByKey: gemini.activeKeyNum });
  } catch (err: any) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message || 'AI service unavailable.' });
  }
});

// ── 4. Soil Recommendation ── [ROTATOR] ──────────────────────────────────
app.post('/api/soil-recommendation', async (req, res) => {
  const { pH, nitrogen, phosphorus, potassium } = req.body;
  try {
    const prompt = `Act as a certified soil scientist advising an Indian farmer. Soil test results: pH ${pH}, Nitrogen ${nitrogen} kg/ha, Phosphorus ${phosphorus} kg/ha, Potassium ${potassium} kg/ha.

Provide 3–4 specific, actionable soil amendment recommendations:
- Name each amendment (e.g., urea, lime, compost)
- Give exact quantity per acre
- Mention whether organic or chemical
- Keep it practical and concise (use bullet points)`;
    const text = await gemini.generateContent([prompt]);
    res.json({ recommendations: text, servedByKey: gemini.activeKeyNum });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI soil service unavailable.' });
  }
});

// ── 5. Agri Calculators (no AI) ─────────────────────────────────────────
app.post('/api/calculate-input', (req, res) => {
  const { fieldAreaInAcres, productType } = req.body;
  const rates = AGRI_INPUTS[productType] || {};
  const recs: any = {};
  Object.keys(rates).forEach(k => recs[k] = +(rates[k] * fieldAreaInAcres).toFixed(2));
  res.json({ recommendations: recs, unit: productType === 'fertilizer' ? 'kg' : 'liters' });
});

app.post('/api/estimate-irrigation', (req, res) => {
  const { pumpPowerKw, fieldAreaInAcres, areaFilledPerHour = 0.5 } = req.body;
  const time = +(fieldAreaInAcres / areaFilledPerHour).toFixed(2);
  const units = +(pumpPowerKw * time).toFixed(2);
  res.json({ totalTimeHours: time, electricityUnits: units, cost: +(units * 7.5).toFixed(2) });
});

// ── 6. Harvest Window (no AI) ────────────────────────────────────────────
app.post('/api/harvest-window', (req, res) => {
  const { cropName, sowingDate } = req.body;
  const meta = CROPS_META[cropName] || { maturityDays: 100 };
  const sow = new Date(sowingDate);
  const start = new Date(sow); start.setDate(start.getDate() + meta.maturityDays - 10);
  const end   = new Date(sow); end.setDate(end.getDate()   + meta.maturityDays + 10);
  const today = new Date();
  const elapsed = (today.getTime() - sow.getTime()) / 86400000;
  const readiness = Math.min(100, Math.round((elapsed / meta.maturityDays) * 100));
  res.json({ harvestStart: start.toISOString().slice(0,10), harvestEnd: end.toISOString().slice(0,10), currentReadinessPercent: readiness });
});

import { fetchAgriNews } from './services/news';

// ── 7. Government Schemes ────────────────────────────────────────────────
app.post('/api/schemes', (req, res) => {
  const { category = "All" } = req.body;
  const eligible = GOV_SCHEMES.filter(s => category === "All" || s.category === category);
  res.json(eligible);
});

// ── 8. news ─────────────────────────────────────────────────────────────
app.get('/api/news', async (_req, res) => {
  const news = await fetchAgriNews();
  res.json(news);
});

// ── 9. Crop Doctor (Vision AI) ──────────────────────────────────────────
app.post('/api/diagnose', async (req, res) => {
  const { image, crop } = req.body; 
  if (!image) return res.status(400).json({ error: 'Image is required' });

  try {
    const prompt = `Act as a senior plant pathologist. Analyze this leaf image of a ${crop} plant. 
    Identify if there is any disease. If there is, return a valid JSON object starting with { and ending with } containing:
    {
      "name": "Common name of disease (Scientific name)",
      "confidence": 0.95,
      "severity": "low" | "medium" | "high",
      "symptoms": "Brief bullet points of symptoms",
      "organic": "Specific organic treatment",
      "chemical": "Specific chemical treatment",
      "prevention": "Specific prevention steps"
    }
    If it's healthy, return:
    {
      "name": "Healthy Plant",
      "confidence": 0.99,
      "severity": "low",
      "symptoms": "No visible disease symptoms.",
      "organic": "Continue normal nutrition",
      "chemical": "None required",
      "prevention": "Regular monitoring"
    }
    Return ONLY JSON.`;

    const [mimeType, base64Data] = image.split(';base64,');
    const type = mimeType.split(':')[1];

    const result = await gemini.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: type,
          data: base64Data
        }
      }
    ], "gemini-1.5-flash");

    // Clean JSON from Markdown blocks if any
    const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(cleanJson));
  } catch (err: any) {
    console.error('Diagnosis error:', err);
    res.status(500).json({ error: 'AI diagnosis failed: ' + err.message });
  }
});

// ── 10. Crop Monitoring Board ──────────────────────────────────────────
app.get('/api/crop-monitoring', (req, res) => {
  const crops = ["wheat", "rice", "tomato", "onion"];
  const stages = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Maturity", "Harvest"];
  
  const results = crops.map(id => {
    const meta = CROPS_META[id] || { maturityDays: 100 };
    // Stable mock based on the day of the year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const stageIdx = Math.floor((dayOfYear % meta.maturityDays) / (meta.maturityDays / stages.length));
    
    return {
      id,
      stage: stages[stageIdx],
      health: (dayOfYear + id.length) % 10 > 2 ? "Excellent" : "Good",
      daysToHarvest: Math.max(0, meta.maturityDays - (dayOfYear % meta.maturityDays)),
      moisture: 60 + (dayOfYear % 20),
      temp: 24 + (dayOfYear % 8)
    };
  });
  
  res.json(results);
});

// ── 11. Market Board – All Mandis for a crop (ML – no AI) ─────────────────
// Returns current ML-predicted price + 7-day trend for every mandi in the
// frontend ALL_MANDIS list. The mandi IDs must match exactly.
const ALL_MANDI_IDS = [
  'ludhiana', 'amritsar', 'bathinda',
  'azadpur', 'ghaziabad', 'kanpur',
  'bowenpally', 'gudimalkapur', 'guntur', 'kurnool', 'warangal',
  'pune-market', 'nashik', 'nagpur', 'solapur',
  'jaipur', 'kota',
  'bhopal', 'indore',
  'bangalore', 'hubli',
  'coimbatore', 'madurai',
];

app.get('/api/market-board', (req, res) => {
  const crop = (req.query.crop as string) || 'tomato';

  const results = ALL_MANDI_IDS.map(mandiId => {
    // Generate 21 days of history then run linear regression for forecast
    const { points } = generatePriceSeries(crop, mandiId, 21, 0);
    const historical = points.filter((p: any) => !p.isForecast);
    const predicted  = predictNext7Days(historical);
    const trend      = getTrendStatus(historical, predicted);

    // "Today's price" = last historical point (most recent)
    const todayPrice = historical.length ? historical[historical.length - 1].price : 0;
    // "7-day forecast" = last predicted point
    const forecastPrice = predicted.length ? predicted[predicted.length - 1].price : todayPrice;
    const pctChange = todayPrice > 0 ? ((forecastPrice - todayPrice) / todayPrice) * 100 : 0;

    return {
      id: mandiId,
      price: todayPrice,
      forecastPrice: +forecastPrice.toFixed(2),
      pctChange: +pctChange.toFixed(1),
      trend,                            // 'UP' | 'DOWN' | 'STABLE'
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
  });

  res.json({ crop, mandis: results, generatedAt: new Date().toISOString() });
});

// ── 8. AI Key Status (diagnostic) ────────────────────────────────────────
app.get('/api/key-status', (_req, res) => {
  res.json({
    totalKeys: gemini.keyCount,
    currentActiveKey: gemini.activeKeyNum,
    message: `Currently using key ${gemini.activeKeyNum} of ${gemini.keyCount}`
  });
});

// ── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🌾 farmintel API v3  →  http://localhost:${PORT}`);
  console.log(`🔑 Gemini Rotator   →  ${gemini.keyCount} keys loaded, starting with key 1\n`);
});
