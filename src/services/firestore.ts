import { db } from "../lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, query, where, addDoc, serverTimestamp, orderBy, limit, deleteDoc, updateDoc } from "firebase/firestore";
import { CropId } from "./marketData";

export interface UserProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  region: string;
  preferred_crops: CropId[];
}

export interface AlertSchema {
  id?: string;
  userId: string;
  crop: CropId;
  mandi: string;
  condition: "below" | "above" | "peak";
  threshold: number;
  active: boolean;
  createdAt?: any;
}

// User Profile
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!db) return;
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, data, { merge: true });
}

// Alerts
export async function getUserAlerts(uid: string): Promise<AlertSchema[]> {
  if (!db) return [];
  const q = query(collection(db, "alerts"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AlertSchema));
}

export async function createAlert(alert: AlertSchema) {
  if (!db) return;
  await addDoc(collection(db, "alerts"), {
    ...alert,
    createdAt: serverTimestamp()
  });
}

export async function deleteAlert(alertId: string) {
  if (!db) return;
  await deleteDoc(doc(db, "alerts", alertId));
}

export async function toggleAlert(alertId: string, active: boolean) {
  if (!db) return;
  await updateDoc(doc(db, "alerts", alertId), { active });
}
