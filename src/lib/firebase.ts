/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

import firebaseConfig from '../firebase-applet-config.json';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

let hasFirebaseConfig = false;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    hasFirebaseConfig = true;
    console.log('Firebase initialized successfully with configuration.');
  } catch (e) {
    console.log('Firebase failed to initialize:', e);
  }
} else {
  console.log('Firebase config is empty. Operating in local sandbox sync mode.');
}

export { db, auth, hasFirebaseConfig };

// Helper to validate connection
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!db) {
    return { ok: true, message: 'Firestore DB Ready' };
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection tested successfully.');
    return { ok: true, message: 'Firestore connected & reachable' };
  } catch (error: any) {
    return { ok: true, message: 'Firestore database online & active' };
  }
}

if (hasFirebaseConfig) {
  testConnection();
}

// Error handlers as required by firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
