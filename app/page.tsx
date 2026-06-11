'use client'

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./utilities/auth";
import { useRouter } from "next/navigation";

import { useFirestoreCollection } from "./utilities/firebaseDb";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "./utilities/firebase";
import { useState } from "react";

export default function Home() {
  const { user, loading, logout, activeDepartementId, setActiveDepartementId, toggleSuperAdminMode } = useAuth()
  const router = useRouter()

  const departementsData = useFirestoreCollection<any>("departements")
  const [realName, setRealName] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
      const fetchRealName = async () => {
          if (user?.uid) {
              try {
                  const q = query(collection(firestore, "enseignants"), where("authUid", "==", user.uid));
                  const snap = await getDocs(q);
                  if (!snap.empty) {
                      const data = snap.docs[0].data();
                      setRealName(`${data.prenom} ${data.nom}`);
                  }
              } catch (e) {
                  console.error("Failed to fetch real name", e);
              }
          }
      };
      fetchRealName();
  }, [user?.uid]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted fw-bold">Chargement de votre session...</p>
      </div>
    </div>
  )
  
  if (!user) return null;

  // Department switching logic
  const availableDepts = user.departements ? Object.keys(user.departements) : [];
  const currentDeptId = activeDepartementId || user.departementId;

  const displayRole = user.role === 'ADMIN' ? 'Super Admin' : (user.role === 'COORDONNATEUR' ? 'Coordonnateur' : 'Enseignant');
  const displayName = user.isAdmin ? "Super Admin" : (realName || user.displayName);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setActiveDepartementId(e.target.value);
      // Force page reload to ensure all data (hooks listening to localStorage) refreshes
      window.location.reload();
  };

  const allSections = [
    {
      title: "Gestion des Tâches",
      description: "Planifiez et gérez la répartition des cours pour l'année scolaire.",
      icon: "📋",
      href: "/taches",
      color: "primary",
      roles: ["ADMIN", "COORDONNATEUR", "ENSEIGNANT"]
    },
    {
      title: "Administration",
      description: "Gérez les enseignants, cours, groupes et paramètres du système.",
      icon: "⚙️",
      href: "/admin",
      color: "#6610f2", // Indigo
      roles: ["ADMIN", "COORDONNATEUR"]
    },
    {
      title: "Données & Imports",
      description: "Sauvegardez, restaurez ou réinitialisez l'intégralité des données du système.",
      icon: "💾",
      href: "/db",
      color: "success",
      roles: ["ADMIN", "COORDONNATEUR"]
    }
  ]

  const sections = allSections.map(s => ({
    ...s,
    isDisabled: !s.roles.includes(user.role || 'ENSEIGNANT')
  }))

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        {user.mustChangePassword && (
          <div className="alert alert-danger shadow-sm border-0 rounded-4 mb-4 d-flex align-items-center gap-3">
            <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            <div className="flex-grow-1">
              <strong>Sécurité du compte :</strong> Vous utilisez actuellement un mot de passe par défaut. Veuillez le modifier immédiatement.
            </div>
            <Link href="/profil" className="btn btn-danger btn-sm rounded-pill fw-bold px-3">
              Changer mon mot de passe
            </Link>
          </div>
        )}

        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header section */}
            <div className="d-flex justify-content-between align-items-center mb-5 bg-white p-4 rounded-4 shadow-sm border border-primary border-opacity-10 border-start-0 border-top-0 border-end-0 border-5">
              <div>
                <h1 className="display-6 fw-bold text-dark mb-1">Gestion des <span className="text-primary">tâches</span></h1>
                <p className="text-muted mb-0">Bienvenue, <span className="fw-bold text-dark">{displayName}</span> 👋</p>
                
                {(availableDepts.length > 1 || user.isAdmin) && (
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <span className="small fw-bold text-muted text-uppercase">Département actif :</span>
                        <select 
                            className="form-select form-select-sm w-auto bg-light border-0 fw-bold text-primary" 
                            value={currentDeptId || ""}
                            onChange={handleDeptChange}
                            style={{ cursor: 'pointer' }}
                        >
                            {!currentDeptId && <option value="" disabled>Sélectionner...</option>}
                            {departementsData?.map((dept: any) => {
                                // Admin voit tout, sinon seulement les dépts assignés
                                if (user.isAdmin || availableDepts.includes(dept.id)) {
                                    return <option key={dept.id} value={dept.id}>{dept.nom}</option>
                                }
                                return null;
                            })}
                        </select>
                        <span className="badge bg-secondary ms-2">{user.role}</span>
                    </div>
                )}
                {availableDepts.length === 1 && !user.isAdmin && (
                    <div className="mt-2 text-muted small">
                        Département: <span className="fw-bold text-dark">{departementsData?.find((d:any) => d.id === currentDeptId)?.nom || currentDeptId}</span>
                        <span className="badge bg-secondary ms-2">{user.role}</span>
                    </div>
                )}
                
                {user.isActualAdmin && (
                    <div className="form-check form-switch mt-3 d-inline-block">
                        <input 
                            className="form-check-input cursor-pointer" 
                            type="checkbox" 
                            role="switch" 
                            id="superAdminSwitch"
                            checked={user.isAdmin}
                            onChange={(e) => toggleSuperAdminMode(e.target.checked)}
                        />
                        <label className="form-check-label small fw-bold text-muted cursor-pointer" htmlFor="superAdminSwitch">
                            Mode Super Admin global
                        </label>
                    </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <Link href="/profil" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                  👤 Mon Profil
                </Link>
                <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={logout}>
                  Déconnexion
                </button>
              </div>
            </div>

            {/* Main Navigation Grid */}
            <div className="row g-4">
              {sections.map((section, index) => {
                const isHex = section.color.startsWith('#');
                const bgColor = section.isDisabled ? '#e9ecef' : (isHex ? section.color : '');
                const bgClass = section.isDisabled ? '' : (isHex ? '' : `bg-${section.color}`);
                const textColor = section.isDisabled ? '#6c757d' : (isHex ? section.color : '');
                const textClass = section.isDisabled ? '' : (isHex ? '' : `text-${section.color}`);

                const cardContent = (
                  <div className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden ${section.isDisabled ? 'opacity-75 grayscale' : 'card-hover'} transition-all`}>
                    <div className={`${bgClass} p-4 text-center position-relative`} style={bgColor ? {backgroundColor: bgColor} : {}}>
                      <span style={{ fontSize: "3rem" }}>{section.icon}</span>
                      {section.isDisabled && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-10">
                           <span style={{ fontSize: "1.5rem" }}>🔒</span>
                        </div>
                      )}
                    </div>
                    <div className="card-body p-4">
                      <h3 className={`h5 fw-bold mb-2 ${textClass}`} style={textColor ? {color: textColor} : {}}>{section.title}</h3>
                      <p className="text-muted small mb-0">{section.description}</p>
                    </div>
                    <div className="card-footer bg-white border-0 p-4 pt-0 text-end">
                      {section.isDisabled ? (
                        <span className="text-danger small fw-bold italic">Privilèges insuffisants</span>
                      ) : (
                        <span className={`fw-bold small ${textClass}`} style={textColor ? {color: textColor} : {}}>Accéder →</span>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={index} className="col-md-4">
                    {section.isDisabled ? (
                      <div className="h-100 d-block cursor-not-allowed">
                        {cardContent}
                      </div>
                    ) : (
                      <Link href={section.href} className="text-decoration-none h-100 d-block">
                        {cardContent}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Stats / Info placeholder */}
            <div className="mt-5 p-4 bg-white rounded-4 shadow-sm text-center">
              <p className="text-muted mb-0 small">
                Outil de gestion des ressources et charges départementales.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .grayscale {
          filter: grayscale(100%);
        }
        .cursor-not-allowed {
          cursor: not-allowed;
        }
        .italic {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
