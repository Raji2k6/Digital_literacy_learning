// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoxQZhK9qtFvg_ZeDXCFxKP62gsh73cC8",
  authDomain: "infovia-5d18a.firebaseapp.com",
  projectId: "infovia-5d18a",
  storageBucket: "infovia-5d18a.firebasestorage.app",
  messagingSenderId: "1061299118475",
  appId: "1:1061299118475:web:d0646427883445c9dc4f8e"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in your app
export const auth = getAuth(app);
export const firestore = getFirestore(app);