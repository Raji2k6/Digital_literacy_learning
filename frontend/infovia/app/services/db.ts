// app/services/db.ts
import { db } from "./firebaseConfig";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
  collection, query, orderBy, limit, getDocs, increment
} from "firebase/firestore";

export type UserProfile = {
  displayName?: string;
  xp?: number;
  badges?: string[];
  createdAt?: any;
};

export const ensureUserDoc = async (uid: string) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { xp: 0, badges: [], createdAt: serverTimestamp() } as UserProfile);
  }
};

export const addXP = (uid: string, amount: number) =>
  updateDoc(doc(db, "users", uid), { xp: increment(amount) });

export const addBadge = async (uid: string, badge: string) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const badges = snap.exists() ? (snap.data().badges || []) : [];
  if (!badges.includes(badge)) {
    await updateDoc(ref, { badges: [...badges, badge] });
  }
};

export const saveModuleScore = (uid: string, moduleId: string, score: number) =>
  setDoc(
    doc(db, "progress", uid),
    { [moduleId]: { score, updatedAt: serverTimestamp() } },
    { merge: true }
  );

export const getLeaderboardTop = async (topN = 20) => {
  const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(topN));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};