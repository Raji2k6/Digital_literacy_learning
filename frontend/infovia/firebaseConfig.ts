// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUK7cxgOQIdaAoBtENTtVSqVQ4tYg9mFI",
  authDomain: "digitalliteracyapp-ae5fe.firebaseapp.com",
  projectId: "digitalliteracyapp-ae5fe",
  storageBucket: "digitalliteracyapp-ae5fe.firebasestorage.app",
  messagingSenderId: "1084538513178",
  appId: "1:1084538513178:web:c5d6b73be09deff3202ea3",
  measurementId: "G-YJC9TWJQ4G"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in your app
export const auth = getAuth(app);
export const firestore = getFirestore(app);