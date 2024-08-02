import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBoYxWzkhNj6QT9UNJO2SfhH_ACAupJMaE",
  authDomain: "inventory-pantry.firebaseapp.com",
  projectId: "inventory-pantry",
  storageBucket: "inventory-pantry.appspot.com",
  messagingSenderId: "571075400282",
  appId: "1:571075400282:web:6e01848dab63695a9afe63",
  measurementId: "G-RSYMG3JJMT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const firestore = getFirestore(app)

export { auth, firestore }