import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: In a real-world application, these values should be stored in
// environment variables and not be hardcoded. For this example, we assume
// they are provided by the execution environment.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: Firestore;
let googleProvider: firebase.auth.GoogleAuthProvider;


// A fallback for environments where process.env is not defined or is empty.
if (!firebaseConfig.apiKey) {
  console.warn("Firebase config not found in environment variables. Authentication and Firestore will not work.");
  // Provide placeholder objects to prevent runtime errors
  app = {} as firebase.app.App;
  auth = {} as firebase.auth.Auth;
  db = {} as Firestore;
  googleProvider = {} as firebase.auth.GoogleAuthProvider;
} else {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = getFirestore(app);
  googleProvider = new firebase.auth.GoogleAuthProvider();
}


export { app, auth, db, googleProvider };