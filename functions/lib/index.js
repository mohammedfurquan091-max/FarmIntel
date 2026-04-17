"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceAlertChecker = exports.reportOutbreak = exports.createPost = exports.estimateHarvestWindow = exports.improveSoilRecommendation = exports.getEligibleSchemes = exports.createRentalRequest = exports.searchNearbyEquipment = exports.estimateIrrigationCost = exports.calculateInputAmount = exports.addJournalEntry = exports.getDashboardData = exports.diagnosePlantDisease = exports.chatWithKisanAI = exports.createGroupRequest = exports.findBestMarket = exports.predictCropPrice = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const mockData_1 = require("./services/mockData");
const ml_1 = require("./services/ml");
const logger = __importStar(require("firebase-functions/logger"));
admin.initializeApp();
const db = admin.firestore();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
exports.predictCropPrice = (0, https_1.onCall)(async (request) => {
    const { crop, region } = request.data;
    if (!crop || !region)
        throw new https_1.HttpsError("invalid-argument", "Missing crop or region");
    const { points: historicalData } = (0, mockData_1.generatePriceSeries)(crop, region, 21, 0);
    const historical = historicalData.filter((p) => !p.isForecast);
    const predicted_prices = (0, ml_1.predictNext7Days)(historical);
    const trend = (0, ml_1.getTrendStatus)(historical, predicted_prices);
    return { crop, region, trend, historical, predicted_prices, confidence: 91.2 };
});
exports.findBestMarket = (0, https_1.onCall)(async (request) => {
    const { crop, quantity, transportCostPerKm } = request.data;
    if (!crop || !quantity)
        throw new https_1.HttpsError("invalid-argument", "Missing crop or quantity");
    const recommendations = mockData_1.MANDIS.map(mandi => {
        const { points } = (0, mockData_1.generatePriceSeries)(crop, mandi.id, 0, 1);
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
exports.createGroupRequest = (0, https_1.onCall)(async (request) => {
    const { userId, crop, quantity, district } = request.data;
    if (!userId || !crop || !quantity)
        throw new https_1.HttpsError("invalid-argument", "Missing required fields");
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
exports.chatWithKisanAI = (0, https_1.onCall)(async (request) => {
    const { userId, message, sessionId, language } = request.data;
    if (!message)
        throw new https_1.HttpsError("invalid-argument", "Missing message");
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
                messages: admin.firestore.FieldValue.arrayUnion({ role: "user", text: message, timestamp: new Date() }, { role: "assistant", text: responseText, timestamp: new Date() })
            }, { merge: true });
        }
        return { text: responseText };
    }
    catch (error) {
        logger.error("Gemini Chat Error", error);
        throw new https_1.HttpsError("internal", "AI Assistant unavailable");
    }
});
exports.diagnosePlantDisease = (0, https_1.onCall)(async (request) => {
    const { imageUrl } = request.data;
    if (!imageUrl)
        throw new https_1.HttpsError("invalid-argument", "Missing image URL");
    return {
        disease: "Early Blight",
        confidence: 0.89,
        treatment: {
            organic: "Apply neem oil or copper-based fungicide.",
            chemical: "Use Chlorothalonil or Mancozeb sprays."
        }
    };
});
exports.getDashboardData = (0, https_1.onCall)(async (request) => {
    const { userId } = request.data;
    if (!userId)
        throw new https_1.HttpsError("unauthenticated", "User must be logged in");
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
exports.addJournalEntry = (0, https_1.onCall)(async (request) => {
    const { userId, entry } = request.data;
    await db.collection("farmJournal").add({ ...entry, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true };
});
exports.calculateInputAmount = (0, https_1.onCall)(async (request) => {
    const { cropName, fieldAreaInAcres, productType } = request.data;
    const rates = mockData_1.AGRI_INPUTS;
    const standardRates = rates[productType] || {};
    const recommendations = {};
    Object.keys(standardRates).forEach(key => {
        recommendations[key] = standardRates[key] * fieldAreaInAcres;
    });
    return { recommendations, unit: productType === 'fertilizer' ? 'kg' : 'liters' };
});
exports.estimateIrrigationCost = (0, https_1.onCall)(async (request) => {
    const { pumpPowerKw, fieldAreaInAcres, areaFilledPerHour } = request.data;
    const timeRequired = fieldAreaInAcres / (areaFilledPerHour || 0.5);
    const unitsConsumed = pumpPowerKw * timeRequired;
    const cost = unitsConsumed * 7.5;
    return { cost, totalTimeHours: timeRequired, electricityUnits: unitsConsumed };
});
exports.searchNearbyEquipment = (0, https_1.onCall)(async (request) => {
    const { type, district } = request.data;
    const snap = await db.collection("equipmentListings")
        .where("type", "==", type)
        .where("availability", "==", true)
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
exports.createRentalRequest = (0, https_1.onCall)(async (request) => {
    const { renterId, listingId, startDate, endDate } = request.data;
    const listingRef = db.collection("equipmentListings").doc(listingId);
    const listing = (await listingRef.get()).data();
    if (!listing || !listing.availability)
        throw new https_1.HttpsError("failed-precondition", "Equipment unavailable");
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
exports.getEligibleSchemes = (0, https_1.onCall)(async (request) => {
    const { landSizeAcres, crops } = request.data;
    const eligible = mockData_1.GOV_SCHEMES.filter(scheme => {
        const landOk = !scheme.eligibility.maxLandAcres || landSizeAcres <= scheme.eligibility.maxLandAcres;
        const cropOk = !scheme.eligibility.crops || crops.some((c) => scheme.eligibility.crops.includes(c));
        return landOk && cropOk;
    });
    return eligible;
});
exports.improveSoilRecommendation = (0, https_1.onCall)(async (request) => {
    const { pH, nitrogen, phosphorus, potassium } = request.data;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Act as a soil expert. Given these values: pH: ${pH}, N: ${nitrogen}, P: ${phosphorus}, K: ${potassium}. 
  Recommend 3 specific organic amendments to improve soil health for a standard Indian cereal crop. Keep it simple and bulleted.`;
    const result = await model.generateContent(prompt);
    return { recommendations: result.response.text() };
});
exports.estimateHarvestWindow = (0, https_1.onCall)(async (request) => {
    const { cropName, sowingDate } = request.data;
    const meta = mockData_1.CROPS_META[cropName] || { maturityDays: 100 };
    const sowing = new Date(sowingDate);
    const harvestStart = new Date(sowing);
    harvestStart.setDate(harvestStart.getDate() + meta.maturityDays - 10);
    const harvestEnd = new Date(sowing);
    harvestEnd.setDate(harvestEnd.getDate() + meta.maturityDays + 10);
    return {
        harvestStart: harvestStart.toISOString().slice(0, 10),
        harvestEnd: harvestEnd.toISOString().slice(0, 10),
        currentReadiness: 65
    };
});
exports.createPost = (0, https_1.onCall)(async (request) => {
    const { userId, title, body, tags } = request.data;
    const docRef = await db.collection("forumPosts").add({
        userId, title, body, tags, upvotes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id };
});
exports.reportOutbreak = (0, https_1.onCall)(async (request) => {
    const { district, diseaseName, userId } = request.data;
    await db.collection("outbreaks").add({
        district, diseaseName, reporterId: userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        severity: "medium"
    });
    return { success: true };
});
exports.priceAlertChecker = (0, scheduler_1.onSchedule)("every 6 hours", async (event) => {
    const alertsSnap = await db.collection("priceAlerts").where("active", "==", true).get();
    if (alertsSnap.empty)
        return;
    for (const doc of alertsSnap.docs) {
        const alert = doc.data();
        const { points } = (0, mockData_1.generatePriceSeries)(alert.cropName, alert.mandiId || "ludhiana", 0, 0);
        const currentPrice = points[0].price;
        let triggered = false;
        if (alert.condition === ">=" && currentPrice >= alert.targetPrice)
            triggered = true;
        if (alert.condition === "<=" && currentPrice <= alert.targetPrice)
            triggered = true;
        if (triggered) {
            await doc.ref.update({ active: false, triggeredAt: new Date().toISOString() });
            logger.info(`Notification: ${alert.cropName} price target reached!`);
        }
    }
});
//# sourceMappingURL=index.js.map