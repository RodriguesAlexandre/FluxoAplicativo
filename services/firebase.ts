
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

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


// Check if the essential config key is present.
if (!firebaseConfig.apiKey) {
  console.warn("Firebase config not found in environment variables. Authentication and Firestore will not work.");
  // Provide placeholder objects to prevent runtime errors on other parts of the app.
  app = {} as firebase.app.App;
  auth = { app: undefined } as unknown as firebase.auth.Auth; // Mock auth to have a falsy app property
  db = {} as Firestore;
  googleProvider = {} as firebase.auth.GoogleAuthProvider;
} else {
  // Initialize Firebase only if the config is valid.
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