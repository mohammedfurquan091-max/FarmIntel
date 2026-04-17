import { Router } from 'express';
import { db } from '../firebase-admin';
import { generatePriceSeries, CROPS_META, MANDIS } from '../services/mockData';

const router = Router();

// Seed database with initial metadata and historical data
router.post('/seed', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase Admin not initialized' });

  try {
    const batch = db.batch();

    // 1. Seed Crops
    Object.keys(CROPS_META).forEach(cropId => {
      const cropRef = db!.collection('crops').doc(cropId);
      batch.set(cropRef, {
        id: cropId,
        ...CROPS_META[cropId],
        updatedAt: new Date().toISOString()
      });
    });

    // 2. Seed Mandis (Markets)
    MANDIS.forEach(mandi => {
      const mandiRef = db!.collection('mandis').doc(mandi.id);
      batch.set(mandiRef, {
        ...mandi,
        updatedAt: new Date().toISOString()
      });
    });

    // 3. Seed some historical price data for the last 30 days for each crop-mandi pair
    // Note: In a real app, this would be a massive amount of data. 
    // For the seed, we'll just do current prices.
    for (const cropId of Object.keys(CROPS_META)) {
      for (const mandi of MANDIS) {
        const { points } = generatePriceSeries(cropId, mandi.id, 30, 0);
        points.forEach(p => {
          const priceRef = db!.collection('price_data').doc(`${cropId}_${mandi.id}_${p.date}`);
          batch.set(priceRef, {
            crop: cropId,
            mandiId: mandi.id,
            price: p.price,
            date: p.date,
            isForecast: false
          });
        });
      }
    }

    await batch.commit();
    res.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload CSV data (Simulated)
router.post('/upload-csv', async (req, res) => {
  if (!db) {
    return res.status(503).json({ 
      error: 'Firebase Admin not initialized. Please ensure FIREBASE_SERVICE_ACCOUNT is set in your .env file to enable CSV uploads.' 
    });
  }
  
  const { data } = req.body; // Expecting array of objects from CSV parsing
  if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Invalid data format' });

  try {
    const CHUNK_SIZE = 499;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      const batch = db.batch();
      
      chunk.forEach((row: any) => {
        if (row.date && row.crop && row.mandi && row.price) {
          const docId = `${row.crop}_${row.mandi}_${row.date}`;
          const ref = db!.collection('price_data').doc(docId);
          batch.set(ref, {
            date: row.date,
            crop: row.crop,
            mandiId: row.mandi,
            price: Number(row.price),
            isForecast: false
          });
        }
      });
      
      await batch.commit();
    }
    
    res.json({ message: `Successfully ingested ${data.length} rows` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Retrain model (Simulated)
router.post('/retrain', async (req, res) => {
  // Logic to 'retrain' - in a real app, this might trigger a Python job
  // Here we just update a 'last_trained' timestamp in a config doc
  if (!db) return res.status(503).json({ error: 'Firebase Admin not initialized' });

  try {
    await db.collection('config').doc('prediction_model').set({
      last_trained: new Date().toISOString(),
      status: 'ready',
      version: '2.1.0'
    }, { merge: true });

    res.json({ message: 'Model retraining completed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Database Stats
router.get('/stats', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase Admin not initialized' });

  try {
    const cropsCount = (await db.collection('crops').count().get()).data().count;
    const mandisCount = (await db.collection('mandis').count().get()).data().count;
    const pricesCount = (await db.collection('price_data').count().get()).data().count;

    res.json({
      crops: cropsCount,
      mandis: mandisCount,
      prices: pricesCount,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
