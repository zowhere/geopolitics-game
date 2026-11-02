import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5Y-RWE1DxrtB7DruA0gH3opo5ANoTA40",
  authDomain: "geopolitics-game-b9b31.firebaseapp.com",
  projectId: "geopolitics-game-b9b31",
  storageBucket: "geopolitics-game-b9b31.firebasestorage.app",
  messagingSenderId: "221951599575",
  appId: "1:221951599575:web:2f99c9e5aa674a3521e192",
  measurementId: "G-J0WFN5XT3D",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = getFirestore(app);

// Safely initialize Analytics (only in supported browser environments)
export const analyticsPromise = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null,
);
