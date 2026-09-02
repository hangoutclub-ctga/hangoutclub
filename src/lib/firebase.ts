// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlz3f--ACxO3YKD-qymlKO2I_wUwueH9M",
  authDomain: "hangout-club-yg27s.firebaseapp.com",
  projectId: "hangout-club-yg27s",
  storageBucket: "hangout-club-yg27s.appspot.com",
  messagingSenderId: "163666139186",
  appId: "1:163666139186:web:b7d501f36b62a5dc77842b"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
