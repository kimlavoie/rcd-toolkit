import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/utilities/firebaseAdmin';

async function verifyCreatorRights(req: Request, targetIsAdmin: boolean, targetDepartements: Record<string, string>) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Non autorisé');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Un Admin global peut tout faire (compatibilité avec l'ancien rôle ADMIN pendant la transition)
    if (decodedToken.isAdmin === true || decodedToken.role === 'ADMIN') {
        return decodedToken;
    }

    const userDepts = decodedToken.departements || {};

    // Si pas admin global, interdiction de créer ou modifier un admin global
    if (targetIsAdmin) {
        throw new Error('Un coordonnateur ne peut pas créer ou modifier un administrateur global');
    }

    // Un coordonnateur ne peut agir que sur les départements où il est coordonnateur
    for (const [deptId, role] of Object.entries(targetDepartements)) {
        if (userDepts[deptId] !== 'COORDONNATEUR') {
            throw new Error(`Action restreinte : vous n'êtes pas coordonnateur du département ${deptId}`);
        }
        if (role === 'ADMIN') {
             throw new Error(`Action restreinte : vous ne pouvez pas assigner le rôle ADMIN dans un département`);
        }
    }

    return decodedToken;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Fallback for old clients sending 'role' and 'departementId'
        let { numeroEmploye, prenom, nom, courriel, isAdmin, departements, role, departementId } = body;

        if (!prenom || !nom || !courriel) {
            return NextResponse.json({ error: 'Prénom, nom et courriel requis' }, { status: 400 });
        }

        // Backward compatibility mapping
        if (isAdmin === undefined) isAdmin = role === 'ADMIN';
        if (departements === undefined) {
            departements = {};
            if (departementId && !isAdmin) {
                departements[departementId] = role || 'ENSEIGNANT';
            }
        }

        const decodedToken = await verifyCreatorRights(req, isAdmin, departements);
        
        let authUid = "";
        let existingDocId = null;
        let isReused = false;

        // Check if user already exists in Firestore by email
        const snapshot = await adminDb.collection('enseignants').where('courriel', '==', courriel).limit(1).get();
        if (!snapshot.empty) {
            existingDocId = snapshot.docs[0].id;
            const existingData = snapshot.docs[0].data();
            authUid = existingData.authUid || "";
            isReused = true;
            
            // Merge departments (coordinators can only add/update their own departments)
            departements = { ...(existingData.departements || {}), ...departements };
            // Preserve isAdmin status
            isAdmin = existingData.isAdmin || isAdmin;
        }

        if (!isReused) {
            // 1. Création de l'utilisateur dans Firebase Auth si nouveau
            const tempPassword = `${nom}${prenom}1234!`.replace(/\s+/g, '');
            try {
                const userRecord = await adminAuth.createUser({
                    email: courriel,
                    password: tempPassword,
                    displayName: `${prenom} ${nom}`,
                });
                authUid = userRecord.uid;
            } catch (authError: any) {
                console.error("Erreur creation Auth:", authError);
                // Si l'utilisateur existe déjà dans Auth mais pas dans Firestore (désynchronisation rare)
                if (authError.code === 'auth/email-already-exists') {
                    const userRecord = await adminAuth.getUserByEmail(courriel);
                    authUid = userRecord.uid;
                } else {
                    return NextResponse.json({ error: `Erreur création compte d'accès: ${authError.message}` }, { status: 400 });
                }
            }
        }

        // 2. Assignation des Custom Claims
        if (authUid) {
            try {
                const currentClaims = isReused ? (await adminAuth.getUser(authUid)).customClaims || {} : {};
                const newClaims = {
                    ...currentClaims,
                    isAdmin: isAdmin,
                    departements: departements,
                    mustChangePassword: isReused ? currentClaims.mustChangePassword : true
                };
                
                // Cleanup standard OIDC claims
                delete (newClaims as any).aud; delete (newClaims as any).auth_time; delete (newClaims as any).exp; delete (newClaims as any).iat; delete (newClaims as any).iss; delete (newClaims as any).sub; delete (newClaims as any).firebase; delete (newClaims as any).user_id;

                await adminAuth.setCustomUserClaims(authUid, newClaims);
            } catch (authError: any) {
                 console.error("Erreur mise à jour Auth claims:", authError);
            }
        }

        // 3. Création ou Mise à jour de l'enseignant dans Firestore
        const enseignantData = {
            numeroEmploye: numeroEmploye || "",
            prenom,
            nom,
            courriel,
            isAdmin,
            departements,
            authUid: authUid || null,
            ...( !isReused && { mustChangePassword: true } )
        };

        let docId = existingDocId;
        if (isReused && existingDocId) {
            await adminDb.collection('enseignants').doc(existingDocId).update(enseignantData);
        } else {
            const docRef = await adminDb.collection('enseignants').add(enseignantData);
            docId = docRef.id;
        }

        return NextResponse.json({ 
            id: docId,
            uid: authUid, 
            tempPassword: (!isReused && authUid) ? `${nom}${prenom}1234!`.replace(/\s+/g, '') : null,
            isReused: isReused
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur API enseignants (POST):", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: error.message.includes('Action restreinte') || error.message.includes('Accès refusé') ? 403 : 401 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        // Fallback for old clients
        let { id, numeroEmploye, prenom, nom, courriel, isAdmin, departements, role, departementId, authUid } = body;

        if (!id || !prenom || !nom || !courriel) {
            return NextResponse.json({ error: 'ID, prénom, nom, courriel requis' }, { status: 400 });
        }

        // Backward compatibility mapping
        if (isAdmin === undefined) isAdmin = role === 'ADMIN';
        if (departements === undefined) {
            departements = {};
            if (departementId && !isAdmin) {
                departements[departementId] = role || 'ENSEIGNANT';
            }
        }

        const decodedToken = await verifyCreatorRights(req, isAdmin, departements);

        const existingDoc = await adminDb.collection('enseignants').doc(id).get();
        const currentData = existingDoc.data() || {};

        // Protection supplémentaire : On ne peut pas modifier un profil qui est DÉJÀ admin si on n'est pas admin soi-même
        if (decodedToken.isAdmin !== true && decodedToken.role !== 'ADMIN') {
            if (currentData.isAdmin === true || currentData.role === 'ADMIN') {
                throw new Error('Vous ne pouvez pas modifier un profil administrateur global');
            }
            // A coordinator should only modify their own departments. Preserve other departments.
            departements = { ...(currentData.departements || {}), ...departements };
            // Ensure they didn't magically set isAdmin to true
            isAdmin = false;
        }

        let effectiveAuthUid = authUid || currentData.authUid;

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
            isAdmin,
            departements,
            authUid: effectiveAuthUid || null
        };

        await adminDb.collection('enseignants').doc(id).update(enseignantData);

        // 2. Mise à jour Auth (Claims) si on a un authUid
        if (effectiveAuthUid) {
            try {
                const currentClaims = (await adminAuth.getUser(effectiveAuthUid)).customClaims || {};
                const claims = {
                    ...currentClaims,
                    isAdmin: isAdmin,
                    departements: departements
                };
                 // Cleanup standard OIDC claims
                delete (claims as any).aud; delete (claims as any).auth_time; delete (claims as any).exp; delete (claims as any).iat; delete (claims as any).iss; delete (claims as any).sub; delete (claims as any).firebase; delete (claims as any).user_id;

                await adminAuth.setCustomUserClaims(effectiveAuthUid, claims);
            } catch (authError: any) {
                console.error("Erreur mise à jour Auth claims:", authError);
                // On ne bloque pas si la mise à jour des claims échoue
            }
        }

        return NextResponse.json({ success: true, authUid: effectiveAuthUid }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur API enseignants (PUT):", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: error.message.includes('Action restreinte') || error.message.includes('refusé') ? 403 : 401 });
    }
}


export async function DELETE(req: Request) {
    try {
        const { id, departementId } = await req.json();

        if (!id || !departementId) {
            return NextResponse.json({ error: 'ID et département requis' }, { status: 400 });
        }

        const decodedToken = await verifyCreatorRights(req, false, { [departementId]: 'ENSEIGNANT' });
        const callerIsAdmin = decodedToken.isAdmin === true || decodedToken.role === 'ADMIN';

        const docRef = adminDb.collection('enseignants').doc(id);
        const existingDoc = await docRef.get();
        if (!existingDoc.exists) {
            return NextResponse.json({ error: 'Enseignant introuvable' }, { status: 404 });
        }
        const currentData = existingDoc.data() || {};

        if (!callerIsAdmin && (currentData.isAdmin === true || currentData.role === 'ADMIN')) {
            throw new Error('Vous ne pouvez pas supprimer un profil administrateur global');
        }

        // 1. Supprimer les données associées dans ce département
        const refs: FirebaseFirestore.DocumentReference[] = [];
        for (const col of ['charges', 'liberations', 'supervisions']) {
            const snap = await adminDb.collection(col)
                .where('enseignant', '==', id)
                .where('departementId', '==', departementId)
                .get();
            snap.forEach(d => refs.push(d.ref));
        }
        for (let i = 0; i < refs.length; i += 450) {
            const batch = adminDb.batch();
            refs.slice(i, i + 450).forEach(r => batch.delete(r));
            await batch.commit();
        }

        // 2. Retirer le département de l'enseignant
        const { [departementId]: _removed, ...remainingDepts } = currentData.departements || {};
        const authUid: string | null = currentData.authUid || null;
        const isLastDept = Object.keys(remainingDepts).length === 0 && currentData.isAdmin !== true;

        if (isLastDept) {
            await docRef.delete();
            if (authUid) {
                try {
                    await adminAuth.deleteUser(authUid);
                } catch (authError: any) {
                    console.error("Erreur suppression compte Auth:", authError);
                }
            }
        } else {
            await docRef.update({ departements: remainingDepts });
            if (authUid) {
                try {
                    const currentClaims = (await adminAuth.getUser(authUid)).customClaims || {};
                    await adminAuth.setCustomUserClaims(authUid, { ...currentClaims, departements: remainingDepts });
                } catch (authError: any) {
                    console.error("Erreur mise à jour Auth claims:", authError);
                }
            }
        }

        return NextResponse.json({ success: true, deleted: isLastDept }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur API enseignants (DELETE):", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: error.message.includes('Action restreinte') || error.message.includes('refusé') || error.message.includes('ne peut pas') || error.message.includes('Vous ne pouvez pas') ? 403 : 401 });
    }
}
