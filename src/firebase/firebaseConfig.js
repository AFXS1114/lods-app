import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9Lt714RRUT8O75x-X8pEhI_oFr1Tv3wU",
  authDomain: "lods-app-845f7.firebaseapp.com",
  projectId: "lods-app-845f7",
  storageBucket: "lods-app-845f7.firebasestorage.app",
  messagingSenderId: "319912452042",
  appId: "1:319912452042:web:2268437788befd1fb4f933"
};
const app = initializeApp(firebaseConfig);

// Proper React Native auth persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };

