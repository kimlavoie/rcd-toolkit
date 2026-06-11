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

        const body = await req.json();
        const { id, password } = body;

        if (!id || !password) {
            return NextResponse.json({ error: 'ID et mot de passe requis' }, { status: 400 });
        }

        // Récupérer le document Firestore
        const docRef = adminDb.collection('enseignants').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
             return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 });
        }

        const data = doc.data()!;
        
        // Vérifier les droits du demandeur (Admin ou Coordonnateur du bon département)
        if (decodedToken.isAdmin !== true && decodedToken.role !== 'ADMIN') {
             // Si pas Admin global, doit être coordonnateur d'au moins un département de l'enseignant
             const userDepts = decodedToken.departements || {};
             const targetDepts = data.departements || {};
             let hasRight = false;

             for (const deptId of Object.keys(targetDepts)) {
                 if (userDepts[deptId] === 'COORDONNATEUR') {
                     hasRight = true;
                     break;
                 }
             }

             if (!hasRight) {
                 return NextResponse.json({ error: 'Accès refusé. Vous n\'êtes pas coordonnateur pour cet enseignant.' }, { status: 403 });
             }
        }

        if (data.authUid) {
             return NextResponse.json({ error: 'Ce profil possède déjà un accès.' }, { status: 400 });
        }

        // Créer l'utilisateur Auth
        const userRecord = await adminAuth.createUser({
            email: data.courriel,
            password: password,
            displayName: `${data.prenom} ${data.nom}`,
        });

        const authUid = userRecord.uid;

        // Assigner les custom claims
        const claims = {
            isAdmin: data.isAdmin || false,
            departements: data.departements || {},
            mustChangePassword: true
        };

        await adminAuth.setCustomUserClaims(authUid, claims);

        // Mettre à jour le doc Firestore
        await docRef.update({
            authUid: authUid,
            mustChangePassword: true
        });

        return NextResponse.json({ success: true, uid: authUid }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur création accès enseignant:", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
