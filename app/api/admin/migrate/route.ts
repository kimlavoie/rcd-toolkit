import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/utilities/firebaseAdmin';

// TEMPORARY MIGRATION SCRIPT
// Run this once for each existing user to move them to the new Department model

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;
        
        // Prevent double migration
        if (decodedToken.departementId) {
             return NextResponse.json({ message: 'Déjà migré' }, { status: 200 });
        }

        const userRecord = await adminAuth.getUser(userId);
        const deptName = userRecord.displayName ? `Département de ${userRecord.displayName}` : `Département ${userId.substring(0,5)}`;

        // 1. Create a new Department
        const departementRef = await adminDb.collection('departements').add({
            nom: deptName,
            migratedFromUserId: userId, // Keep a trace just in case
            createdAt: new Date().toISOString()
        });

        const departementId = departementRef.id;

        // 2. Assign Custom Claims to make this user the Coordinator of the new department
        const claims = {
            role: 'COORDONNATEUR',
            departementId: departementId
        };
        await adminAuth.setCustomUserClaims(userId, claims);

        // 3. Migrate all existing data (Replace userId with departementId)
        const collectionsToMigrate = [
            'enseignants', 'cours', 'groupes', 'allocations', 'stages',
            'charges', 'liberations', 'supervisions', 'scenarios',
            'CIReelles', 'preferences', 'parametres'
        ];

        let totalMigrated = 0;

        for (const colName of collectionsToMigrate) {
            const snapshot = await adminDb.collection(colName).where('userId', '==', userId).get();
            if (snapshot.empty) continue;

            const batch = adminDb.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    departementId: departementId
                    // We intentionally keep userId for now as a fallback during the transition period,
                    // but the app now relies on departementId.
                });
                totalMigrated++;
            });
            await batch.commit();
        }

        return NextResponse.json({ 
            success: true, 
            message: `Migration complétée. Nouveau département: ${departementId}. Documents migrés: ${totalMigrated}` 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: error.message || 'Migration échouée' }, { status: 500 });
    }
}
