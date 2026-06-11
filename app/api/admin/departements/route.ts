import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/utilities/firebaseAdmin';

// Vérifie si l'utilisateur est Super Admin
async function verifySuperAdmin(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Non autorisé');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.role !== 'ADMIN') {
        throw new Error('Accès refusé');
    }

    return decodedToken;
}

export async function POST(req: Request) {
    try {
        await verifySuperAdmin(req);
        
        const body = await req.json();
        const { nom } = body;

        if (!nom) {
            return NextResponse.json({ error: 'Le nom du département est requis' }, { status: 400 });
        }

        const departementRef = await adminDb.collection('departements').add({
            nom: nom,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ id: departementRef.id, nom }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur création département:", error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: error.message === 'Accès refusé' ? 403 : 401 });
    }
}
