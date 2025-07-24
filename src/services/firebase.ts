
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: Vite exposes environment variables on the `import.meta.env` object.
// VITE_ is a required prefix for variables to be exposed to the client.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: Firestore;
let googleProvider: firebase.auth.GoogleAuthProvider;


// A fallback for environments where the env variables are not set.
if (!firebaseConfig.apiKey) {
  console.warn("Firebase config not found in environment variables. Authentication and Firestore will not work. Make sure to set VITE_FIREBASE_* variables in your .env file or hosting environment.");
  // Provide placeholder objects to prevent runtime errors
  app = {} as firebase.app.App;
  auth = {} as firebase.auth.Auth;
  db = {} as Firestore;
  googleProvider = {} as firebase.auth.GoogleAuthProvider;
} else {
  // Check if Firebase app is already initialized to avoid errors during HMR.
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  auth = firebase.auth();
  db = getFirestore(app);
  googleProvider = new firebase.auth.GoogleAuthProvider();
}


export { app, auth, db, googleProvider };
