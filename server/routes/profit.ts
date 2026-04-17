import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  const { quantity, cost, predicted_price, distance_km = 12 } = req.body;

  if (quantity === undefined || predicted_price === undefined) {
    return res.status(400).json({ error: 'Missing quantity or predicted_price' });
  }

  // Assuming ₹5 per km transport and 3% commission
  const transport_cost = distance_km * 5;
  const gross_revenue = quantity * predicted_price;
  const commission = gross_revenue * 0.03;
  const input_cost = cost || 0;

  const total_deductions = transport_cost + commission + input_cost;
  const net_profit = gross_revenue - total_deductions;
  const margin_pct = gross_revenue > 0 ? (net_profit / gross_revenue) * 100 : 0;

  let suggestion = "Profit margin is solid. Consider selling.";
  if (margin_pct < 10) suggestion = "Profit margin is low due to transport or commissions. Wait for higher prices.";
  if (margin_pct > 30) suggestion = "Exceptional profit margin! This is an ideal time to sell.";

  res.json({
    revenue: gross_revenue,
    transport_cost,
    commission,
    total_deductions,
    profit: net_profit,
    margin_pct,
    suggestion
  });
});

export default router;
