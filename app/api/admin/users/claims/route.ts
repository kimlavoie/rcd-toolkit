import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/utilities/firebaseAdmin';

// Vérifie les droits de mise à jour des rôles
async function verifyUpdateRights(req: Request, targetRole: string, targetDept: string) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Non autorisé');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Un Admin peut tout modifier
    if (decodedToken.role === 'ADMIN') {
        return decodedToken;
    }

    // Un Coordonnateur ne peut gérer que son département et ne peut pas créer d'Admin ou d'autres Coordonnateurs (sauf peut-être d'autres coordonnateurs si on le décide, mais limitons aux enseignants pour l'instant)
    if (decodedToken.role === 'COORDONNATEUR') {
        if (targetRole !== 'ENSEIGNANT') {
            throw new Error('Un coordonnateur ne peut assigner que le rôle enseignant');
        }
        if (decodedToken.departementId !== targetDept) {
            throw new Error('Action restreinte à votre propre département');
        }
        return decodedToken;
    }

    throw new Error('Accès refusé');
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { uid, role, departementId } = body;

        if (!uid || !role) {
            return NextResponse.json({ error: 'UID et rôle requis' }, { status: 400 });
        }

        if (role !== 'ADMIN' && !departementId) {
             return NextResponse.json({ error: 'Un département est requis pour ce rôle' }, { status: 400 });
        }

        await verifyUpdateRights(req, role, departementId);

        const claims = {
            role: role,
            departementId: role === 'ADMIN' ? null : departementId
        };

        await adminAuth.setCustomUserClaims(uid, claims);

        return NextResponse.json({ 
            uid: uid, 
            role: claims.role,
            departementId: claims.departementId
        }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur mise à jour claims:", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 400 });
    }
}
