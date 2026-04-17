import { Router } from 'express';
import { MANDIS } from '../services/mockData';
import { getCached, setCache } from '../middleware/cache';

const router = Router();

router.post('/', (req, res) => {
  const { crop, region, predicted_prices } = req.body;

  if (!crop || !predicted_prices || !Array.isArray(predicted_prices)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const cacheKey = `recommend:${crop}:${region}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) return res.json(cachedData);

  setTimeout(() => {
    // Basic analysis logic
    const currentPrice = predicted_prices[0]?.price || 0;
    const peakPriceObj = [...predicted_prices].sort((a, b) => b.price - a.price)[0];
    const trend = peakPriceObj.price > currentPrice ? 'rising' : 'falling';
    const mandi = MANDIS.find((m) => m.id === region) || MANDIS[0];

    const reasoning = `Based on my analysis of ${crop} prices across local mandis, I recommend selling at **${mandi.name}** within the next **${new Date(peakPriceObj.date).getDate() - new Date().getDate()} days**. Here's my reasoning:\n\n📈 **Price Trend**: ${crop} prices are currently ${trend}. The price is expected to peak at ₹${peakPriceObj.price.toFixed(2)} on ${peakPriceObj.date}.\n🏪 **Market Comparison**: This represents a ${(100*Math.abs(peakPriceObj.price - currentPrice)/currentPrice).toFixed(1)}% difference from today's price.`;

    const responseData = {
      best_market: mandi.id,
      best_time: peakPriceObj.date,
      peak_price: peakPriceObj.price,
      reasoning
    };

    setCache(cacheKey, responseData);
    res.json(responseData);
  }, 800); // simulate LLM reasoning generation delay
});

export default router;
