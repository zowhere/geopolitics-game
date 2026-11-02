import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5Y-RWE1DxrtB7DruA0gH3opo5ANoTA40",
  authDomain: "geopolitics-game-b9b31.firebaseapp.com",
  projectId: "geopolitics-game-b9b31",
  storageBucket: "geopolitics-game-b9b31.firebasestorage.app",
  messagingSenderId: "221951599575",
  appId: "1:221951599575:web:2f99c9e5aa674a3521e192",
  measurementId: "G-J0WFN5XT3D",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
