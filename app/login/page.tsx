'use client'

import { useAuth } from "../utilities/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function LoginPage() {
    const { loginWithEmail, user, loading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            await loginWithEmail(email, password);
            toast.success("Connexion réussie");
        } catch (error: any) {
            const message = error.code === 'auth/invalid-credential' ? "Identifiants invalides" : error.message;
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMigration = async () => {
        if (!user) return;
        setIsSubmitting(true);
        const loadingToast = toast.loading("Migration en cours...");
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/migrate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Migration échouée");
            toast.success(data.message || "Migration réussie");
            // Force reload to refresh claims
            window.location.href = "/";
        } catch (error: any) {
            console.error("Migration error", error);
            toast.error(error.message);
        } finally {
            toast.dismiss(loadingToast);
            setIsSubmitting(false);
        }
    }

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p className="text-muted fw-bold">Vérification de l'authentification...</p>
            </div>
        </div>
    );

    if (user) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ maxWidth: "450px", width: "100%" }}>
                    <div className="card-body p-4 p-md-5 bg-white text-center">
                        <h2 className="h4 fw-bold mb-3">Redirection en cours...</h2>
                        <p className="text-muted mb-4">Vous êtes déjà connecté en tant que {user.email}.</p>
                        
                        <hr className="my-4" />
                        
                        <div className="alert alert-warning text-start">
                            <h5 className="alert-heading h6 fw-bold">⚠️ Migration Système</h5>
                            <p className="small mb-3">Si vous n'avez plus accès à vos données suite à la récente mise à jour du système, veuillez lancer l'assistant de migration.</p>
                            <button 
                                className="btn btn-warning w-100 fw-bold shadow-sm"
                                onClick={handleMigration}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Migration..." : "Lancer la migration"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

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
                            Se connecter
                        </h2>

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
                            <label className="form-label small fw-bold text-muted">
                                MOT DE PASSE
                            </label>
                            <div className="input-group">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="form-control" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ borderRight: "none" }}
                                />
                                <button 
                                    className="btn btn-outline-secondary" 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ 
                                        borderLeft: "none", 
                                        backgroundColor: "#fff",
                                        borderColor: "#dee2e6",
                                        color: "#6c757d"
                                    }}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.827 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : null}
                            Se connecter
                        </button>
                    </form>
                    
                    <div className="pt-3 border-top text-center mt-4">
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
