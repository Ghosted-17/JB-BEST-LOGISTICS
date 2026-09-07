import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK initialization for JB & Best Logistics LLC.
 * Ensures single instance initialization across Next.js server actions, API routes,
 * and background tasks without throwing "[DEFAULT] already exists" during development.
 */
let app: App;

if (!getApps().length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const parsedServiceAccount = JSON.parse(serviceAccountKey);
      app = initializeApp({
        credential: cert(parsedServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || parsedServiceAccount.project_id,
      });
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON. Falling back to application default credentials:', parseError);
      app = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'jb-best-logistics',
      });
    }
  } else if (
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PROJECT_ID
  ) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Development fallback / Application Default Credentials
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'jb-best-logistics',
    });
  }
} else {
  app = getApps()[0];
}

export const adminDb: Firestore = getFirestore(app);
export const adminAuth: Auth = getAuth(app);
export default app;
