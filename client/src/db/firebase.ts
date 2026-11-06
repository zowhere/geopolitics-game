//Import initializeApp to connect the application to Firebase using its configuration.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; //llows users to register, log in and manage their authenticated sessions.
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"; //initialise the database and configure offline persistence

//identifies firebase project the game connects to
const firebaseConfig = {
  apiKey: "AIzaSyB5Y-RWE1DxrtB7DruA0gH3opo5ANoTA40",
  authDomain: "geopolitics-game-b9b31.firebaseapp.com",
  projectId: "geopolitics-game-b9b31",
  storageBucket: "geopolitics-game-b9b31.firebasestorage.app",
  messagingSenderId: "221951599575",
  appId: "1:221951599575:web:2f99c9e5aa674a3521e192",
  measurementId: "G-J0WFN5XT3D",
};

export const app = initializeApp(firebaseConfig); //initializes the Firebase project so game uses Firebase services like auth and DB
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    //caches data in the browser (IndexedDB) so data loads faster and survives short connection drops
    tabManager: persistentMultipleTabManager(), //lets multiple open tabs share the same cache
  }),
});
