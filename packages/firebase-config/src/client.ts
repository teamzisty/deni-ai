import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore'

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let db: Database | undefined;

// Define environment variables interface
interface Env {
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
}

// Use process.env with type safety
const env: Env = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};


if (env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  try {
    const firebaseConfig = {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    }

    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    
    // FirebaseのFirestoreでundefinedプロパティを無視する設定を追加
    firestore = initializeFirestore(app, {
      ignoreUndefinedProperties: true
    });
    
    db = getDatabase(app)
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase initialization skipped: NEXT_PUBLIC_FIREBASE_API_KEY is not defined");
}

export { app, auth, firestore, db }