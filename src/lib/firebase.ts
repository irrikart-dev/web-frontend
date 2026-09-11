import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase *web* app config — from Firebase Console > Project settings > General >
// "Your apps" > Web app. Not the same as the admin-SDK service account used by the backend.
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const firebaseAuth = getAuth(firebaseApp);
