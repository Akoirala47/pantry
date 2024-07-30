import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCYkbi3HL62WgjL5nNjxZTXHyItw09rthE",
    authDomain: "pantry-40e32.firebaseapp.com",
    projectId: "pantry-40e32",
    storageBucket: "pantry-40e32.appspot.com",
    messagingSenderId: "914328450166",
    appId: "1:914328450166:web:97f32819a476d08d861b57",
    measurementId: "G-QVN07J0VFX"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)



export { app, auth };
