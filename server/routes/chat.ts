import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are an agricultural expert assistant for the platform AgroIntel. 

STRICT DOMAIN RESTRICTION:
- You ONLY answer agriculture-related questions (crops, farming, livestock, soil, crop prices, markets).
- If the question is UNRELATED to agriculture, responding with: 'I can only assist with agriculture-related queries.'
- Do NOT talk about general topics, politics, celebrities, or coding unless it's strictly in a farming context.

INTELLIGENCE CONTEXT:
- Users will provide you with user messages, their current crop, region, and AI-predicted prices.
- Use this data to provide professional, simple, and helpful advice.
- When explaining prices, be objective and use the predicted numbers to give strategic recommendations (e.g., "Prices are expected to rise, so you might want to wait").
`;

router.post('/', async (req, res) => {
  const { message, crop, region, predicted_prices } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Construct context-rich prompt
    const context = `
      User Message: "${message}"
      Current Crop Context: ${crop || 'General Agriculture'}
      Current Region: ${region || 'Unknown'}
      Predicted 7-Day Prices: ${JSON.stringify(predicted_prices || [])}
    `;

    const result = await model.generateContent([SYSTEM_PROMPT, context]);
    const responseText = result.response.text();

    res.json({ text: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'AI Assistant is temporarily unavailable. Check API Key configuration.' });
  }
});

export default router;
