import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Country } from "../game/countries";

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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function createAccount(
  email: string,
  password: string,
  username: string,
) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: username });
  await setDoc(doc(db, "users", user.uid), {
    username,
    createdAt: serverTimestamp(),
  });
}

export async function loginWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOutCurrentUser() {
  await signOut(auth);
}

export async function getUserProfile(
  uid: string,
): Promise<{ username: string } | null> {
  const profile = await getDoc(doc(db, "users", uid));
  if (!profile.exists()) return null;

  const username = profile.data().username;
  return typeof username === "string" ? { username } : null;
}

export async function fetchCountries(): Promise<Country[]> {
  const snapshot = await getDocs(collection(db, "countries"));
  if (snapshot.empty) {
    throw new Error("No country records were found in Firestore.");
  }

  return snapshot.docs.map((countryDoc) => countryDoc.data() as Country);
}
