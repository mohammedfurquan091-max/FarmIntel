import { db } from '../firebase-admin';
import { generatePriceSeries, CROPS_META, MANDIS } from '../services/mockData';

async function seed() {
  if (!db) {
    console.error('❌ Firebase Admin not initialized. Check your credentials.');
    process.exit(1);
  }

  console.log('🌱 Starting database seed...');

  try {
    const batch = db.batch();

    // 1. Seed Crops
    console.log('   Syncing Crops...');
    Object.keys(CROPS_META).forEach(cropId => {
      const cropRef = db!.collection('crops').doc(cropId);
      batch.set(cropRef, {
        id: cropId,
        ...CROPS_META[cropId],
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    // 2. Seed Mandis
    console.log('   Syncing Mandis...');
    MANDIS.forEach(mandi => {
      const mandiRef = db!.collection('mandis').doc(mandi.id);
      batch.set(mandiRef, {
        ...mandi,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    // 3. Seed Price Data (30 days historical)
    console.log('   Generating Price Data (Historical)...');
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
          }, { merge: true });
        });
      }
    }

    await batch.commit();
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
