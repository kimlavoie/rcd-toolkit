'use client'

import Link from "next/link";
import { useAuth } from "./utilities/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted fw-bold">Chargement de votre session...</p>
      </div>
    </div>
  )
  
  if (!user) {
    router.push("/login")
    return null
  }

  const sections = [
    {
      title: "Gestion des Tâches",
      description: "Planifiez et gérez la répartition des cours pour l'année scolaire.",
      icon: "📋",
      href: "/taches",
      color: "primary"
    },
    {
      title: "Administration",
      description: "Gérez les enseignants, cours, groupes et paramètres du système.",
      icon: "⚙️",
      href: "/admin",
      color: "#6610f2" // Indigo
    },
    {
      title: "Données & Imports",
      description: "Exportez vos données ou importez de nouvelles listes (Excel/CSV).",
      icon: "💾",
      href: "/db",
      color: "success"
    }
  ]

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header section */}
            <div className="d-flex justify-content-between align-items-center mb-5 bg-white p-4 rounded-4 shadow-sm border border-primary border-opacity-10 border-start-0 border-top-0 border-end-0 border-5">
              <div>
                <h1 className="display-6 fw-bold text-dark mb-1">Gestion des <span className="text-primary">tâches</span></h1>
                <p className="text-muted mb-0">Bienvenue, <span className="fw-bold text-dark">{user.displayName}</span> 👋</p>
              </div>
              <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={logout}>
                Déconnexion
              </button>
            </div>

            {/* Main Navigation Grid */}
            <div className="row g-4">
              {sections.map((section, index) => {
                const isHex = section.color.startsWith('#');
                const bgColor = isHex ? section.color : '';
                const bgClass = isHex ? '' : `bg-${section.color}`;
                const textColor = isHex ? section.color : '';
                const textClass = isHex ? '' : `text-${section.color}`;

                return (
                  <div key={index} className="col-md-4">
                    <Link href={section.href} className="text-decoration-none h-100 d-block">
                      <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden card-hover transition-all">
                        <div className={`${bgClass} p-4 text-center`} style={isHex ? {backgroundColor: bgColor} : {}}>
                          <span style={{ fontSize: "3rem" }}>{section.icon}</span>
                        </div>
                        <div className="card-body p-4">
                          <h3 className={`h5 fw-bold mb-2 ${textClass}`} style={isHex ? {color: textColor} : {}}>{section.title}</h3>
                          <p className="text-muted small mb-0">{section.description}</p>
                        </div>
                        <div className="card-footer bg-white border-0 p-4 pt-0 text-end">
                          <span className={`fw-bold small ${textClass}`} style={isHex ? {color: textColor} : {}}>Accéder →</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Quick Stats / Info placeholder */}
            <div className="mt-5 p-4 bg-white rounded-4 shadow-sm text-center">
              <p className="text-muted mb-0 small">
                Outil de gestion des ressources et charges départementales. Version Cloud (Firebase).
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
      `}</style>
    </div>
  );
}
