# farmintel Backend Integration & AI Guide

This document provides the necessary details for the frontend to consume the new Firebase Cloud Functions and explains the AI logic behind the system.

## 🔗 Cloud Functions Integration

All functions are implemented as **Firebase Https Callable (v2)**. Use the Firebase SDK on the frontend to call them.

### 1. Market Intelligence
| Function Name | Input Data | Response Schema |
| :--- | :--- | :--- |
| `predictCropPrice` | `{ crop: string, region: string }` | `{ crop, region, trend, historical, predicted_prices, confidence }` |
| `getDashboardData` | `{ userId: string }` | `{ tasks: [], alerts: [], weather: {} }` |

**Example Call (Frontend):**
```typescript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const predictPrice = httpsCallable(functions, 'predictCropPrice');
const result = await predictPrice({ crop: 'wheat', region: 'ludhiana' });
console.log(result.data);
```

### 2. AI Services
| Function Name | Input Data | Response Schema |
| :--- | :--- | :--- |
| `chatWithKisanAI` | `{ userId, message, sessionId, language }` | `{ text: string }` |
| `diagnosePlantDisease` | `{ imageUrl: string }` | `{ disease, confidence, treatment: { organic, chemical } }` |

---

## 🤖 Gemini Prompt Templates

These templates are embedded in the backend to ensure high-quality, safe agricultural advice.

### 1. farmintel Assistant (Chat)
> "You are 'farmintel AI', a friendly and multilingual agricultural expert for Indian farmers. You provide advice in [LANGUAGE]. ONLY answer questions related to farming, crops, soil, markets, and prices. If the question is unrelated, politely say you can only help with agriculture."

### 2. Crop Doctor (Vision)
> "Analyze this plant image. Identify any diseases, pests or nutrient deficiencies. Provide: Disease Name, Confidence, Treatment Steps (Organic and Chemical options). Respond in a clear structured format."

### 3. Price Forecasting (Reasoning)
> "Analyze the provided historical price series for [CROP] in [REGION]. Based on the trend and seasonal volatility, explain if the farmer should sell now or wait. Be objective and cite the numbers."

---

## 🛠️ Deployment Instructions

1.  **Environment Variables**:
    Set your Gemini API key in the Firebase project:
    ```bash
    firebase functions:secrets:set GEMINI_API_KEY
    ```
2.  **Deployment**:
    ```bash
    firebase deploy --only functions,firestore:rules
    ```

> [!IMPORTANT]
> **FCM Configuration**: Ensure you have downloaded the `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) and initialized the Firebase Messaging SDK to receive the automated price alerts.
