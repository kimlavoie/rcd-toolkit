import { initializeApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check for missing keys explicitly using literal access
const missingKeys = [];
if (!firebaseConfig.apiKey) missingKeys.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain) missingKeys.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId) missingKeys.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!firebaseConfig.storageBucket) missingKeys.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
if (!firebaseConfig.messagingSenderId) missingKeys.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!firebaseConfig.appId) missingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID");

if (missingKeys.length > 0) {
  console.error("Missing Firebase environment variables (Check your .env.local):", missingKeys.join(", "));
}

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Enable offline persistence
// if (typeof window !== "undefined") {
//   enableMultiTabIndexedDbPersistence(firestore).catch((err) => {
//     if (err.code == "failed-precondition") {
//       console.warn("Firebase persistence: Multiple tabs open, persistence can only be enabled in one tab at a a time.");
//     } else if (err.code == "unimplemented") {
//       console.warn("Firebase persistence: The current browser does not support all of the features required to enable persistence.");
//     }
//   });
// }

const auth = getAuth(app);

export { firestore, auth };
