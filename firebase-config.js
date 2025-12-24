// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);