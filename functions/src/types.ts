import { Timestamp } from "firebase-admin/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  language: string;
  district?: string;
  region?: string;
  pincode?: string;
  pumpData?: {
    powerKw: number;
    waterSource: 'borewell' | 'canal';
  };
  landSizeAcres?: number;
  followedCrops: string[];
  createdAt: Timestamp;
}

export interface PricePoint {
  crop: string;
  mandiId: string;
  price: number;
  date: string; // ISO
  isForecast: boolean;
  confidence?: number;
}

export interface ChatSession {
  userId: string;
  sessionId: string;
  lastMessageAt: Timestamp;
  messages: Array<{
    role: "user" | "assistant";
    text: string;
    timestamp: Timestamp;
  }>;
}

export interface FarmJournalEntry {
  userId: string;
  cropName: string;
  activityType: 'sowing' | 'fertilizing' | 'irrigation' | 'harvest' | 'pest_control';
  date: string;
  quantity?: number;
  cost?: number;
  notes?: string;
}

export interface PriceAlert {
  userId: string;
  cropName: string;
  targetPrice: number;
  condition: '>=' | '<=';
  active: boolean;
  triggeredAt?: string;
}

export interface Outbreak {
  id: string;
  district: string;
  diseaseName: string;
  reporterId: string;
  timestamp: Timestamp;
  severity: 'low' | 'medium' | 'high';
  location?: { lat: number; lng: number };
}

export interface EquipmentListing {
  ownerId: string;
  equipmentType: string;
  dailyRate: number;
  locationName: string;
  geohash: string;
  availability: boolean;
  imageUrl?: string;
}

export interface RentalRequest {
  renterId: string;
  ownerId: string;
  listingId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  startDate: string;
  endDate: string;
  totalCost: number;
  createdAt: Timestamp;
}

export interface SoilTest {
  userId: string;
  date: string;
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
}
