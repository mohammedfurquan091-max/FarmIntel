import { fetchPriceSeries, fetchRecommendation, CropId, MANDIS } from "./marketData";

const LANG_PHRASES: Record<string, { intro: string }> = {
  en: { intro: "Here's what I found for" },
  hi: { intro: "यह है जानकारी —" },
  te: { intro: "ఈ సమాచారం -" },
  pa: { intro: "ਇਹ ਜਾਣਕਾਰੀ ਹੈ —" },
};

function detectCrop(q: string): CropId {
  const map: Record<string, CropId> = {
    wheat: "wheat", गेहूं: "wheat", गेहूँ: "wheat", ਕਣਕ: "wheat", గోధుమ: "wheat",
    rice: "rice", चावल: "rice", ਚੌਲ: "rice", బియ్యం: "rice", వరి: "rice",
    maize: "maize", मक्का: "maize", ਮੱਕੀ: "maize", మొక్కజొన్న: "maize",
    tomato: "tomato", टमाटर: "tomato", టమాటా: "tomato", టమటా: "tomato", టమోటా: "tomato",
    onion: "onion", प्याज: "onion", प्याज़: "onion", ਪਿਆਜ਼: "onion", ఉల్లిపాయ: "onion",
  };
  const lower = q.toLowerCase();
  for (const k of Object.keys(map)) if (lower.includes(k.toLowerCase())) return map[k];
  return "tomato";
}

export async function askAdvisor(question: string, lang: string, quantityKg = 100): Promise<string> {
  const crop = detectCrop(question);
  const phr = LANG_PHRASES[lang] ?? LANG_PHRASES.en;

  try {
    // Look at all MANDIS to find the best one for this crop
    const results = await Promise.all(MANDIS.map(async (m) => {
      const s = await fetchPriceSeries(crop, m.id);
      const forecasts = s.filter((p: any) => p.isForecast);
      const r = await fetchRecommendation(crop, m.id, forecasts);
      return { mandi: m, reco: r, price: forecasts[0]?.price || 0 };
    }));

    // Find the one with highest price in 3 days (simplistic logic)
    const best = results.reduce((prev, current) => (current.price > prev.price) ? current : prev);

    return [
      `${phr.intro} **${crop}**.`,
      "",
      `📍 **${best.mandi.name}** seems like the best market right now.`,
      `🤖 ${best.reco.reasoning}`
    ].join("\n");
  } catch (error) {
    return "I'm sorry, I'm having trouble connecting to the market data right now. Please try again later.";
  }
}
