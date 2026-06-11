import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/utilities/firebaseAdmin';

// Vérifie les droits de création d'utilisateur
async function verifyCreatorRights(req: Request, targetRole: string, targetDept: string) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Non autorisé');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Un Admin peut créer n'importe qui
    if (decodedToken.role === 'ADMIN') {
        return decodedToken;
    }

    // Un Coordonnateur ne peut créer que des Enseignants dans son propre département
    if (decodedToken.role === 'COORDONNATEUR') {
        if (targetRole !== 'ENSEIGNANT') {
            throw new Error('Un coordonnateur ne peut créer que des enseignants');
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
        const { email, password, displayName, role, departementId } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Email, mot de passe et rôle requis' }, { status: 400 });
        }

        // Si ce n'est pas un admin, il faut un département
        if (role !== 'ADMIN' && !departementId) {
             return NextResponse.json({ error: 'Un département est requis pour ce rôle' }, { status: 400 });
        }

        await verifyCreatorRights(req, role, departementId);

        // 1. Création de l'utilisateur dans Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName,
        });

        // 2. Assignation des Custom Claims
        const claims = {
            role: role,
            departementId: role === 'ADMIN' ? null : departementId
        };

        await adminAuth.setCustomUserClaims(userRecord.uid, claims);

        return NextResponse.json({ 
            uid: userRecord.uid, 
            email: userRecord.email,
            role: claims.role,
            departementId: claims.departementId
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur création utilisateur:", error);
        // Ne pas retourner les détails précis de Firebase en prod, mais utile en debug
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 400 });
    }
}
