import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvdz992gxjt3skwWmw63pnh8D28HAf9lQ",
  authDomain: "czane-c3786.firebaseapp.com",
  projectId: "czane-c3786",
  storageBucket: "czane-c3786.firebasestorage.app",
  messagingSenderId: "1057600181278",
  appId: "1:1057600181278:web:e4ba7fabab2aadffe30a0f",
  measurementId: "G-F9FFZ5HP1P"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to resolve "Backend didn't respond" errors
// which often occur in environments where WebSockets are restricted.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = firebaseAuth.getAuth(app);