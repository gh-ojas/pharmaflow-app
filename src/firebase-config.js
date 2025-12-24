// 1. Added the missing import for getDatabase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; 

const firebaseConfig = {
  apiKey: "AIzaSyD8B4T4fveXpwe1RJ_zlxa0t7SuDky9rbM",
  authDomain: "pharmaflow-2f6b3.firebaseapp.com",
  databaseURL: "https://pharmaflow-2f6b3-default-rtdb.firebaseio.com",
  projectId: "pharmaflow-2f6b3",
  storageBucket: "pharmaflow-2f6b3.firebasestorage.app",
  messagingSenderId: "1045406962076",
  appId: "1:1045406962076:web:b4de4808f16d7c94ecb859",
  measurementId: "G-EKF9M6EEGG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Added 'export' so App.jsx can use the database
export const db = getDatabase(app);