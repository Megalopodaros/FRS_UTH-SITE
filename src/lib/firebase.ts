import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBElIY-7ErIPT11oXrvwsT4nfVZlzAdUcg",
  authDomain: "upbeat-boulder-bfbwx.firebaseapp.com",
  projectId: "upbeat-boulder-bfbwx",
  storageBucket: "upbeat-boulder-bfbwx.firebasestorage.app",
  messagingSenderId: "703069846162",
  appId: "1:703069846162:web:a03378b8661945753b844b"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provided in the configuration
export const db = getFirestore(app, "ai-studio-foititikaradiosh-9e1b01a2-068d-4b9d-ae9c-9352141f9167");

