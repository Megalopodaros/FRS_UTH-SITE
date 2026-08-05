import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBElIY-7ErIPT11oXrvwsT4nfVZlzAdUcg",
  authDomain: "upbeat-boulder-bfbwx.firebaseapp.com",
  databaseURL: "https://upbeat-boulder-bfbwx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "upbeat-boulder-bfbwx",
  storageBucket: "upbeat-boulder-bfbwx.firebasestorage.app",
  messagingSenderId: "703069846162",
  appId: "1:703069846162:web:a03378b8661945753b844b"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore for chat messages & contact form
export const db = getFirestore(app, "ai-studio-foititikaradiosh-9e1b01a2-068d-4b9d-ae9c-9352141f9167");

// Initialize Realtime Database (RTDB) exclusively for live presence/online counting
export const rtdb = getDatabase(app);