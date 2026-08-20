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
console.info("[FIREBASE_AUTH][INITIALIZED]", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});
void isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

let recaptchaVerifier = null;
let confirmationResult = null;

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `***${digits.slice(-4)}` : "unavailable";
}

function logFirebaseError(stage, error) {
  console.error("[FIREBASE_AUTH][ERROR]", {
    stage,
    code: error?.code || "unknown",
    message: String(error?.message || "Firebase authentication failed").slice(0, 200),
  });
}

function toIndianE164(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
  if (!/^[6-9]\d{9}$/.test(local)) throw new Error("Enter a valid Indian mobile number.");
  return `+91${local}`;
}

async function sendCode(phone) {
  const recipient = toIndianE164(phone);
  console.info("[FIREBASE_AUTH][SMS_REQUEST]", { recipient: maskPhone(recipient) });
  try {
    if (recaptchaVerifier) recaptchaVerifier.clear();
    document.querySelector("#firebase-recaptcha-container").innerHTML = "";
    recaptchaVerifier = new RecaptchaVerifier(auth, "firebase-recaptcha-container", {
      size: "invisible",
    });
    await recaptchaVerifier.render();
    console.info("[FIREBASE_AUTH][RECAPTCHA_READY]");
    confirmationResult = await signInWithPhoneNumber(auth, recipient, recaptchaVerifier);
    console.info("[FIREBASE_AUTH][SMS_SENT]", { recipient: maskPhone(recipient) });
  } catch (error) {
    logFirebaseError("send_code", error);
    throw error;
  }
}

async function confirmCode(code) {
  if (!confirmationResult) throw new Error("Request a new OTP and try again.");
  console.info("[FIREBASE_AUTH][OTP_VERIFY_ATTEMPT]");
  try {
    const credential = await confirmationResult.confirm(code);
    const idToken = await credential.user.getIdToken(true);
    console.info("[FIREBASE_AUTH][OTP_VERIFIED]", {
      recipient: maskPhone(credential.user.phoneNumber),
      firebaseUid: `${credential.user.uid.slice(0, 6)}...`,
    });
    return {
      uid: credential.user.uid,
      phoneNumber: credential.user.phoneNumber,
      idToken,
    };
  } catch (error) {
    logFirebaseError("confirm_code", error);
    throw error;
  }
}

window.valourFirebaseAuth = { sendCode, confirmCode };
