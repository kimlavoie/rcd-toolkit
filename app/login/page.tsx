'use client'

import { useAuth } from "../utilities/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function LoginPage() {
    const { signInWithGoogle, registerWithEmail, loginWithEmail, user, loading } = useAuth();
    const router = useRouter();

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Automatic redirection upon successful login
    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isRegistering) {
                if (!name) throw new Error("Le nom est requis");
                await registerWithEmail(email, password, name);
                toast.success("Compte créé avec succès");
            } else {
                await loginWithEmail(email, password);
                toast.success("Connexion réussie");
            }
        } catch (error: any) {
            const message = error.code === 'auth/email-already-in-use' ? "Cet email est déjà utilisé" :
                           error.code === 'auth/invalid-credential' ? "Identifiants invalides" :
                           error.code === 'auth/weak-password' ? "Le mot de passe est trop court" :
                           error.message;
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user') {
                toast.error("Erreur lors de la connexion Google");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p className="text-muted fw-bold">Vérification de l'authentification...</p>
            </div>
        </div>
    );

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ maxWidth: "450px", width: "100%" }}>
                {/* Visual Header */}
                <div className="bg-primary p-4 text-center text-white">
                    <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm mb-3" style={{ width: "60px", height: "60px", fontSize: "2rem" }}>
                        📋
                    </div>
                    <h1 className="h4 fw-bold mb-1">Gestion des tâches</h1>
                    <p className="opacity-75 mb-0 small text-uppercase letter-spacing-1">Planification départementale</p>
                </div>

                {/* Login Body */}
                <div className="card-body p-4 p-md-5 bg-white">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <h2 className="h5 fw-bold mb-4 text-center">
                            {isRegistering ? "Créer un compte" : "Se connecter"}
                        </h2>

                        {isRegistering && (
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">NOM COMPLET</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Jean Dupont"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">ADRESSE COURRIEL</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                placeholder="nom@institution.ca"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label small fw-bold text-muted">MOT DE PASSE</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 py-2 fw-bold shadow-sm mb-3"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : null}
                            {isRegistering ? "S'enregistrer" : "Se connecter"}
                        </button>

                        <div className="text-center">
                            <button 
                                type="button" 
                                className="btn btn-link btn-sm text-decoration-none"
                                onClick={() => setIsRegistering(!isRegistering)}
                            >
                                {isRegistering ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'enregistrer"}
                            </button>
                        </div>
                    </form>

                    <div className="d-flex align-items-center mb-4">
                        <hr className="flex-grow-1 text-muted opacity-25"/>
                        <span className="px-3 text-muted small fw-bold">OU</span>
                        <hr className="flex-grow-1 text-muted opacity-25"/>
                    </div>
                    
                    <button 
                        type="button"
                        className="btn btn-white border shadow-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 hover-lift transition-all mb-4" 
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                        style={{ borderRadius: "8px", fontWeight: "600", backgroundColor: "#fff" }}
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        Google
                    </button>
                    
                    <div className="pt-3 border-top text-center">
                        <p className="extra-small text-muted mb-0" style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                            Accès sécurisé via Firebase Authentication.<br/>
                            Réservé au personnel autorisé.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .letter-spacing-1 {
                    letter-spacing: 1px;
                }
                .hover-lift:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1) !important;
                }
                .transition-all {
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
}
