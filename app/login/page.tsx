'use client'

import { useAuth } from "../utilities/auth";

export default function LoginPage() {
    const { signInWithGoogle, user, loading, logout } = useAuth();

    if (loading) return <div className="container mt-5">Chargement...</div>;

    return (
        <div className="container mt-5 text-center">
            <h1>RCD Toolkit</h1>
            {user ? (
                <div>
                    <p>Connecté en tant que {user.displayName}</p>
                    <button className="btn btn-danger" onClick={logout}>Déconnexion</button>
                    <hr />
                    <a href="/" className="btn btn-primary">Accéder à l'application</a>
                </div>
            ) : (
                <div>
                    <p>Veuillez vous connecter pour accéder à l'outil.</p>
                    <button className="btn btn-primary" onClick={signInWithGoogle}>Connexion avec Google</button>
                </div>
            )}
        </div>
    );
}
