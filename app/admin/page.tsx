'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../utilities/auth"

export default function AdminPage(){
    const { user, loading } = useAuth()
    const router = useRouter()

    if (loading) return (
        <div className="container mt-5 text-center p-5">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    )
    
    if (!user) {
        router.push("/login")
        return null
    }

    const adminSections = [
        {
            group: "Ressources Humaines",
            items: [
                { title: "Enseignants", icon: "👨‍🏫", href: "admin/enseignants", desc: "Liste et profils des enseignants" },
                { title: "CI Réelles", icon: "📊", href: "admin/CIReelles", desc: "Saisie des charges réelles effectuées" }
            ]
        },
        {
            group: "Structure & Groupes",
            items: [
                { title: "Cours", icon: "📚", href: "admin/cours", desc: "Catalogue des cours et pondérations" },
                { title: "Groupes", icon: "👥", href: "admin/groupes", desc: "Répartition des groupes par session" },
                { title: "Charges", icon: "📝", href: "admin/charges", desc: "Attributions individuelles" }
            ]
        },
        {
            group: "Allocations & Libérations",
            items: [
                { title: "Allocations", icon: "💰", href: "admin/allocations", desc: "Budget et types de libérations" },
                { title: "Libérations", icon: "🔓", href: "admin/liberations", desc: "Attribution des libérations" }
            ]
        },
        {
            group: "Stages & Supervisions",
            items: [
                { title: "Stages", icon: "🏗️", href: "admin/stages", desc: "Paramètres des stages par session" },
                { title: "Supervisions", icon: "👁️", href: "admin/supervisions", desc: "Attribution des stagiaires" }
            ]
        },
        {
            group: "Configuration Avancée",
            items: [
                { title: "Scénarios", icon: "🎭", href: "admin/scenarios", desc: "Gérer les variantes de planification", highlight: true }
            ]
        }
    ]

    return (
        <div className="container py-4">
            <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                <h2 className="mb-0 fw-bold text-dark">
                    <span className="text-primary me-2">⚙️</span> Administration
                </h2>
                <p className="text-muted mb-0 ms-3 d-none d-md-block">Gestion des paramètres et données de base du système.</p>
            </div>

            <div className="row g-4">
                {adminSections.map((section, sIdx) => (
                    <div key={sIdx} className="col-12">
                        <h3 className="h6 text-uppercase fw-bold text-muted mb-3 letter-spacing-1">
                            {section.group}
                        </h3>
                        <div className="row g-3">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="col-md-6 col-lg-4">
                                    <Link href={item.href} className="text-decoration-none">
                                        <div className={`card h-100 border-0 shadow-sm card-hover transition-all ${item.highlight ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}>
                                          <div className="card-body d-flex align-items-center p-3">
                                            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: "48px", height: "48px", fontSize: "1.5rem" }}>
                                              {item.icon}
                                            </div>
                                            <div className="overflow-hidden">
                                              <h4 className={`h6 fw-bold mb-1 ${item.highlight ? 'text-primary' : 'text-dark'}`}>{item.title}</h4>
                                              <p className="text-muted small mb-0 text-truncate">{item.desc}</p>
                                            </div>
                                            <div className="ms-auto ps-2 text-muted opacity-25">
                                              →
                                            </div>
                                          </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .letter-spacing-1 {
                    letter-spacing: 1px;
                }
                .card-hover:hover {
                    transform: translateX(5px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
                    background-color: #fff !important;
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
        </div>
    )
}
