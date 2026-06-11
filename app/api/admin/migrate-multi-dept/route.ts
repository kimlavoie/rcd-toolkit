import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/utilities/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Seul un admin (selon l'ancien ou le nouveau système) peut lancer la migration
        if (decodedToken.role !== 'ADMIN' && decodedToken.isAdmin !== true) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const enseignantsSnapshot = await adminDb.collection('enseignants').get();
        const batch = adminDb.batch();
        let migratedCount = 0;

        for (const doc of enseignantsSnapshot.docs) {
            const data = doc.data();
            
            // Skip if already migrated
            if (data.departements !== undefined || data.isAdmin !== undefined) {
                continue;
            }

            const role = data.role || 'ENSEIGNANT';
            const departementId = data.departementId;
            const authUid = data.authUid;

            const isAdmin = role === 'ADMIN';
            const departements: Record<string, string> = {};
            
            if (departementId && !isAdmin) {
                departements[departementId] = role;
            }

            // Update Firestore
            batch.update(doc.ref, {
                isAdmin: isAdmin,
                departements: departements,
                role: FieldValue.delete(), // Remove old fields
                departementId: FieldValue.delete()
            });

            // Update Auth Claims if authUid exists
            if (authUid) {
                try {
                    const userRecord = await adminAuth.getUser(authUid);
                    const currentClaims = userRecord.customClaims || {};
                    
                    const newClaims = {
                        ...currentClaims,
                        isAdmin: isAdmin,
                        departements: departements,
                    };
                    
                    // Clean up old claims and OIDC standard claims
                    delete (newClaims as any).role;
                    delete (newClaims as any).departementId;
                    delete (newClaims as any).aud;
                    delete (newClaims as any).auth_time;
                    delete (newClaims as any).exp;
                    delete (newClaims as any).iat;
                    delete (newClaims as any).iss;
                    delete (newClaims as any).sub;
                    delete (newClaims as any).firebase;
                    delete (newClaims as any).user_id;

                    await adminAuth.setCustomUserClaims(authUid, newClaims);
                } catch (authError) {
                    console.error(`Erreur mise à jour claims pour ${authUid}:`, authError);
                }
            }

            migratedCount++;
        }

        await batch.commit();

        return NextResponse.json({ success: true, migratedCount }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur lors de la migration:", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}