import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    try {
        // En développement local ou production, on utilise les variables d'environnement
        // Note: FIREBASE_PRIVATE_KEY doit avoir ses retours à la ligne échappés
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
        } else {
            console.warn('Firebase Admin: Variables d\'environnement manquantes. Initialisation avec un projet démo (build phase).');
            initializeApp({ projectId: "demo-project" }); 
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
    }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
