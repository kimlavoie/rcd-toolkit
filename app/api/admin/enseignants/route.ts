import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/utilities/firebaseAdmin';

async function verifyCreatorRights(req: Request, targetRole: string, targetDept: string) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Non autorisé');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Un Admin peut tout faire
    if (decodedToken.role === 'ADMIN') {
        return decodedToken;
    }

    // Un Coordonnateur ne peut gérer que son département et ne peut pas créer d'Admin
    if (decodedToken.role === 'COORDONNATEUR') {
        if (targetRole === 'ADMIN') {
            throw new Error('Un coordonnateur ne peut pas créer d\'administrateur');
        }
        if (decodedToken.departementId !== targetDept) {
            throw new Error('Action restreinte à votre propre département');
        }
        return decodedToken;
    }

    throw new Error('Accès refusé');
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { numeroEmploye, prenom, nom, courriel, role, departementId } = body;

        if (!prenom || !nom || !courriel || !role || !departementId) {
            return NextResponse.json({ error: 'Prénom, nom, courriel, rôle et département requis' }, { status: 400 });
        }

        const decodedToken = await verifyCreatorRights(req, role, departementId);
        
        // Si c'est un coordonnateur, on force son département
        const finalDeptId = decodedToken.role === 'COORDONNATEUR' ? decodedToken.departementId : departementId;

        // 1. Création de l'utilisateur dans Firebase Auth
        // Mot de passe temporaire : NomPrenom1234!
        const tempPassword = `${nom}${prenom}1234!`.replace(/\s+/g, '');
        let authUid = "";
        
        try {
            const userRecord = await adminAuth.createUser({
                email: courriel,
                password: tempPassword,
                displayName: `${prenom} ${nom}`,
            });
            authUid = userRecord.uid;

            // 2. Assignation des Custom Claims
            const claims = {
                role: role,
                departementId: finalDeptId || null,
                mustChangePassword: true
            };

            await adminAuth.setCustomUserClaims(userRecord.uid, claims);

        } catch (authError: any) {
            console.error("Erreur creation Auth:", authError);
            // On continue pour créer le doc Firestore même si l'Auth échoue (ex: user existe déjà)
        }

        // 3. Création de l'enseignant dans Firestore
        const enseignantData = {
            numeroEmploye: numeroEmploye || "",
            prenom,
            nom,
            courriel,
            role,
            departementId: finalDeptId || null,
            authUid: authUid || null,
            mustChangePassword: true
        };

        const docRef = await adminDb.collection('enseignants').add(enseignantData);

        return NextResponse.json({ 
            id: docRef.id,
            uid: authUid, 
            tempPassword: authUid ? tempPassword : null,
            error: authUid ? null : "Compte accès non créé (peut-être existe-t-il déjà ?)"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur API enseignants (POST):", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: error.message === 'Accès refusé' ? 403 : 401 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, numeroEmploye, prenom, nom, courriel, role, departementId, authUid } = body;

        if (!id || !prenom || !nom || !courriel || !role || !departementId) {
            return NextResponse.json({ error: 'ID, prénom, nom, courriel, rôle et département requis' }, { status: 400 });
        }

        const decodedToken = await verifyCreatorRights(req, role, departementId);

        // Protection supplémentaire : On ne peut pas modifier un profil qui est DÉJÀ admin si on n'est pas admin soi-même
        if (decodedToken.role !== 'ADMIN') {
            const existingDoc = await adminDb.collection('enseignants').doc(id).get();
            const currentData = existingDoc.data();
            if (currentData?.role === 'ADMIN') {
                throw new Error('Vous ne pouvez pas modifier un profil administrateur');
            }
        }

        const finalDeptId = decodedToken.role === 'COORDONNATEUR' ? decodedToken.departementId : departementId;

        let effectiveAuthUid = authUid;

        // Si authUid est manquant, on essaie de le trouver par courriel
        if (!effectiveAuthUid && courriel) {
            try {
                const userRecord = await adminAuth.getUserByEmail(courriel);
                effectiveAuthUid = userRecord.uid;
            } catch (e) {
                console.log("Utilisateur non trouvé dans Auth pour le courriel:", courriel);
            }
        }

        // 1. Mise à jour Firestore
        const enseignantData = {
            numeroEmploye: numeroEmploye || "",
            prenom,
            nom,
            courriel,
            role,
            departementId: finalDeptId || null,
            authUid: effectiveAuthUid || null
        };

        await adminDb.collection('enseignants').doc(id).update(enseignantData);

        // 2. Mise à jour Auth (Claims) si on a un authUid
        if (effectiveAuthUid) {
            try {
                const claims = {
                    role: role,
                    departementId: finalDeptId || null
                };
                await adminAuth.setCustomUserClaims(effectiveAuthUid, claims);
            } catch (authError: any) {
                console.error("Erreur mise à jour Auth claims:", authError);
                // On ne bloque pas si la mise à jour des claims échoue
            }
        }

        return NextResponse.json({ success: true, authUid: effectiveAuthUid }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur API enseignants (PUT):", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: error.message === 'Accès refusé' ? 403 : 401 });
    }
}

