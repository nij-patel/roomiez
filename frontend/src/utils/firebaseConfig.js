// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAs_NxMHdQEAGwRnz_VGB3K2OjF92akC0o",
    authDomain: "roomiez-5ce46.firebaseapp.com",
    projectId: "roomiez-5ce46",
    storageBucket: "roomiez-5ce46.firebasestorage.app",
    messagingSenderId: "1024304155164",
    appId: "1:1024304155164:web:f15cca9fb57dd40cffadd9",
    measurementId: "G-2CLKEX5PE1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);