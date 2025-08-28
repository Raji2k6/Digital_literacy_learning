import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAUK7cxgOQIdaAoBtENTtVSqVQ4tYg9mFI",
  authDomain: "digitalliteracyapp-ae5fe.firebaseapp.com",
  projectId: "digitalliteracyapp-ae5fe",
  storageBucket: "digitalliteracyapp-ae5fe.firebasestorage.app",
  messagingSenderId: "1084538513178",
  appId: "1:1084538513178:web:c5d6b73be09deff3202ea3",
};

// Avoid re-initializing in Expo fast refresh
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);