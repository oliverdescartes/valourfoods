import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAr533qlAmpUgUjHfafZ-OByuROCGu-wI",
  authDomain: "valour-a7d3c.firebaseapp.com",
  projectId: "valour-a7d3c",
  storageBucket: "valour-a7d3c.firebasestorage.app",
  messagingSenderId: "764471261958",
  appId: "1:764471261958:web:223554598fb95951d2fc87",
  measurementId: "G-ZE5ZV5Z25J",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();
void isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

let recaptchaVerifier = null;
let confirmationResult = null;

function toIndianE164(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
  if (!/^[6-9]\d{9}$/.test(local)) throw new Error("Enter a valid Indian mobile number.");
  return `+91${local}`;
}

async function sendCode(phone) {
  if (recaptchaVerifier) recaptchaVerifier.clear();
  document.querySelector("#firebase-recaptcha-container").innerHTML = "";
  recaptchaVerifier = new RecaptchaVerifier(auth, "firebase-recaptcha-container", {
    size: "invisible",
  });
  confirmationResult = await signInWithPhoneNumber(
    auth,
    toIndianE164(phone),
    recaptchaVerifier,
  );
}

async function confirmCode(code) {
  if (!confirmationResult) throw new Error("Request a new OTP and try again.");
  const credential = await confirmationResult.confirm(code);
  const idToken = await credential.user.getIdToken(true);
  return {
    uid: credential.user.uid,
    phoneNumber: credential.user.phoneNumber,
    idToken,
  };
}

window.valourFirebaseAuth = { sendCode, confirmCode };
