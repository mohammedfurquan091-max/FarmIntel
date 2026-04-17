import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generatePriceSeries, MANDIS, CROPS_META, GOV_SCHEMES, AGRI_INPUTS } from "./services/mockData";
import { predictNext7Days, getTrendStatus } from "./services/ml";
import * as logger from "firebase-functions/logger";

admin.initializeApp();
const db = admin.firestore();

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// --- 1. AI-Powered Price Intelligence & Market Linkage ---

export const predictCropPrice = onCall(async (request) => {
  const { crop, region } = request.data;
  if (!crop || !region) throw new HttpsError("invalid-argument", "Missing crop or region");

  const { points: historicalData } = generatePriceSeries(crop, region, 21, 0);
  const historical = historicalData.filter((p: any) => !p.isForecast);

  const predicted_prices = predictNext7Days(historical);
  const trend = getTrendStatus(historical, predicted_prices);

  return { crop, region, trend, historical, predicted_prices, confidence: 91.2 };
});

export const findBestMarket = onCall(async (request) => {
  const { crop, quantity, transportCostPerKm } = request.data;
  if (!crop || !quantity) throw new HttpsError("invalid-argument", "Missing crop or quantity");

  const recommendations = MANDIS.map(mandi => {
    const { points } = generatePriceSeries(crop, mandi.id, 0, 1);
    const predictedPrice = points[0].price;
    const distance = mandi.distanceKm;
    const transportTotal = distance * (transportCostPerKm || 2);
    const expectedRevenue = predictedPrice * quantity;
    const expectedProfit = expectedRevenue - transportTotal;

    return {
      marketName: mandi.name,
      state: mandi.state,
      expectedProfit,
      distance,
      transportCost: transportTotal,
      pricePerKg: predictedPrice
    };
  });

  return recommendations.sort((a, b) => b.expectedProfit - a.expectedProfit);
});

export const createGroupRequest = onCall(async (request) => {
  const { userId, crop, quantity, district } = request.data;
  if (!userId || !crop || !quantity) throw new HttpsError("invalid-argument", "Missing required fields");

  const docRef = await db.collection("groupSellingRequests").add({
    userId,
    crop,
    quantity,
    district,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: docRef.id, message: "Group request matches pending." };
});

// --- 2. LLM-Powered Kisan Assistant (Gemini) ---

export const chatWithKisanAI = onCall(async (request) => {
  const { userId, message, sessionId, language } = request.data;
  if (!message) throw new HttpsError("invalid-argument", "Missing message");

  const systemPrompt = `You are "farmintel AI", a friendly and multilingual agricultural expert for Indian farmers. 
  You provide advice in ${language || 'English'}. 
  ONLY answer questions related to farming, crops, soil, markets, and prices. 
  If the question is unrelated, politely say you can only help with agriculture.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([systemPrompt, message]);
    const responseText = result.response.text();

    if (userId && sessionId) {
      const sessionRef = db.collection("users").doc(userId).collection("chatSessions").doc(sessionId);
      await sessionRef.set({
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        messages: admin.firestore.FieldValue.arrayUnion(
          { role: "user", text: message, timestamp: new Date() },
          { role: "assistant", text: responseText, timestamp: new Date() }
        )
      }, { merge: true });
    }

    return { text: responseText };
  } catch (error) {
    logger.error("Gemini Chat Error", error);
    throw new HttpsError("internal", "AI Assistant unavailable");
  }
});

// --- 3. AI Crop Doctor (Vision) ---

export const diagnosePlantDisease = onCall(async (request) => {
  const { imageUrl } = request.data;
  if (!imageUrl) throw new HttpsError("invalid-argument", "Missing image URL");

  return {
    disease: "Early Blight",
    confidence: 0.89,
    treatment: {
      organic: "Apply neem oil or copper-based fungicide.",
      chemical: "Use Chlorothalonil or Mancozeb sprays."
    }
  };
});

// --- 4. Dashboard & Farm Management ---

export const getDashboardData = onCall(async (request) => {
  const { userId } = request.data;
  if (!userId) throw new HttpsError("unauthenticated", "User must be logged in");

  const journalSnap = await db.collection("farmJournal").where("userId", "==", userId).limit(5).get();
  const tasks = journalSnap.docs.map(doc => doc.data());

  const alertsSnap = await db.collection("priceAlerts").where("userId", "==", userId).where("active", "==", true).get();
  const alerts = alertsSnap.docs.map(doc => doc.data());

  return {
    tasks,
    alerts,
    weather: { temp: 28, condition: "Sunny", rainChance: 5 }
  };
});

export const addJournalEntry = onCall(async (request) => {
  const { userId, entry } = request.data;
  await db.collection("farmJournal").add({ ...entry, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return { success: true };
});

// --- 5. Agricultural Calculators ---

export const calculateInputAmount = onCall(async (request) => {
  const { cropName, fieldAreaInAcres, productType } = request.data;
  const rates: any = AGRI_INPUTS;
  const standardRates = rates[productType] || {};
  
  const recommendations: any = {};
  Object.keys(standardRates).forEach(key => {
    recommendations[key] = standardRates[key] * fieldAreaInAcres;
  });

  return { recommendations, unit: productType === 'fertilizer' ? 'kg' : 'liters' };
});

export const estimateIrrigationCost = onCall(async (request) => {
  const { pumpPowerKw, fieldAreaInAcres, areaFilledPerHour } = request.data;
  const timeRequired = fieldAreaInAcres / (areaFilledPerHour || 0.5);
  const unitsConsumed = pumpPowerKw * timeRequired;
  const cost = unitsConsumed * 7.5; // Hypothetical 7.5 INR per unit

  return { cost, totalTimeHours: timeRequired, electricityUnits: unitsConsumed };
});

// --- 6. Rental Marketplace ---

export const searchNearbyEquipment = onCall(async (request) => {
  const { type, district } = request.data;
  const snap = await db.collection("equipmentListings")
    .where("type", "==", type)
    .where("availability", "==", true)
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

export const createRentalRequest = onCall(async (request) => {
  const { renterId, listingId, startDate, endDate } = request.data;
  const listingRef = db.collection("equipmentListings").doc(listingId);
  const listing = (await listingRef.get()).data();

  if (!listing || !listing.availability) throw new HttpsError("failed-precondition", "Equipment unavailable");

  const docRef = await db.collection("rentalRequests").add({
    renterId,
    ownerId: listing.ownerId,
    listingId,
    status: "pending",
    startDate,
    endDate,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { requestId: docRef.id };
});

// --- 7. Government Schemes & Soil Health ---

export const getEligibleSchemes = onCall(async (request) => {
  const { landSizeAcres, crops } = request.data;
  const eligible = GOV_SCHEMES.filter(scheme => {
    const landOk = !scheme.eligibility.maxLandAcres || landSizeAcres <= scheme.eligibility.maxLandAcres;
    const cropOk = !scheme.eligibility.crops || crops.some((c: string) => scheme.eligibility.crops.includes(c));
    return landOk && cropOk;
  });
  return eligible;
});

export const improveSoilRecommendation = onCall(async (request) => {
  const { pH, nitrogen, phosphorus, potassium } = request.data;
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Act as a soil expert. Given these values: pH: ${pH}, N: ${nitrogen}, P: ${phosphorus}, K: ${potassium}. 
  Recommend 3 specific organic amendments to improve soil health for a standard Indian cereal crop. Keep it simple and bulleted.`;
  
  const result = await model.generateContent(prompt);
  return { recommendations: result.response.text() };
});

export const estimateHarvestWindow = onCall(async (request) => {
  const { cropName, sowingDate } = request.data;
  const meta = CROPS_META[cropName] || { maturityDays: 100 };
  const sowing = new Date(sowingDate);
  const harvestStart = new Date(sowing);
  harvestStart.setDate(harvestStart.getDate() + meta.maturityDays - 10);
  const harvestEnd = new Date(sowing);
  harvestEnd.setDate(harvestEnd.getDate() + meta.maturityDays + 10);

  return {
    harvestStart: harvestStart.toISOString().slice(0, 10),
    harvestEnd: harvestEnd.toISOString().slice(0, 10),
    currentReadiness: 65 // Mocked percentage
  };
});

// --- 8. Forum & Outbreaks ---

export const createPost = onCall(async (request) => {
  const { userId, title, body, tags } = request.data;
  const docRef = await db.collection("forumPosts").add({
    userId, title, body, tags, upvotes: 0, 
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { id: docRef.id };
});

export const reportOutbreak = onCall(async (request) => {
  const { district, diseaseName, userId } = request.data;
  await db.collection("outbreaks").add({
    district, diseaseName, reporterId: userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    severity: "medium"
  });
  
  // Future: Trigger broadcast system
  return { success: true };
});

// --- 9. Scheduled Alerts ---

export const priceAlertChecker = onSchedule("every 6 hours", async (event) => {
  const alertsSnap = await db.collection("priceAlerts").where("active", "==", true).get();
  if (alertsSnap.empty) return;

  for (const doc of alertsSnap.docs) {
    const alert = doc.data();
    const { points } = generatePriceSeries(alert.cropName, alert.mandiId || "ludhiana", 0, 0);
    const currentPrice = points[0].price;

    let triggered = false;
    if (alert.condition === ">=" && currentPrice >= alert.targetPrice) triggered = true;
    if (alert.condition === "<=" && currentPrice <= alert.targetPrice) triggered = true;

    if (triggered) {
      await doc.ref.update({ active: false, triggeredAt: new Date().toISOString() });
      logger.info(`Notification: ${alert.cropName} price target reached!`);
    }
  }
});
