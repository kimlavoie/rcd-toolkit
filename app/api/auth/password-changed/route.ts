import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/utilities/firebaseAdmin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        // 1. Mettre à jour Firestore (trouver le doc par authUid)
        const snapshot = await adminDb.collection('enseignants').where('authUid', '==', uid).limit(1).get();
        
        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await adminDb.collection('enseignants').doc(docId).update({
                mustChangePassword: false
            });
        }

        // 2. Mettre à jour les Custom Claims
        const currentClaims = decodedToken;
        const newClaims = {
            ...currentClaims,
            mustChangePassword: false
        };
        // Remove standard OIDC claims before setting custom ones
        delete (newClaims as any).aud;
        delete (newClaims as any).auth_time;
        delete (newClaims as any).exp;
        delete (newClaims as any).iat;
        delete (newClaims as any).iss;
        delete (newClaims as any).sub;
        delete (newClaims as any).firebase;
        delete (newClaims as any).user_id;

        await adminAuth.setCustomUserClaims(uid, newClaims);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur validation changement mot de passe:", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
