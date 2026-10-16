'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../utilities/auth"

export type AdminCategory = "all" | "saisie" | "taches" | "systeme"

export interface AdminItem {
    title: string
    icon: string
    href: string
    desc: string
    category: "saisie" | "taches" | "systeme"
    categoryBadge: string
    badgeClass: string
    highlight?: boolean
}

export interface AdminSection {
    id: "saisie" | "taches" | "systeme"
    group: string
    subtitle: string
    icon: string
    badgeText: string
    badgeClass: string
    quickLink?: {
        label: string
        href: string
    }
    items: AdminItem[]
}

export default function AdminPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState<AdminCategory>("all")

    if (loading) return (
        <div className="container mt-5 text-center p-5">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    )
    
    if (!user) {
        router.push("/login")
        return null
    }

    const adminSections: AdminSection[] = [
        {
            id: "saisie",
            group: "Données de base (Saisie manuelle requise)",
            subtitle: "Menus utilisés pour entrer les informations fondamentales nécessaires au bon fonctionnement du département.",
            icon: "✍️",
            badgeText: "Saisie directe",
            badgeClass: "bg-success bg-opacity-10 text-success border border-success border-opacity-25",
            items: [
                {
                    title: "Enseignants",
                    icon: "👨‍🏫",
                    href: "/admin/enseignants",
                    desc: "Liste et profils des enseignants",
                    category: "saisie",
                    categoryBadge: "✍️ Saisie directe",
                    badgeClass: "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                },
                {
                    title: "Cours",
                    icon: "📚",
                    href: "/admin/cours",
                    desc: "Catalogue des cours et pondérations",
                    category: "saisie",
                    categoryBadge: "✍️ Saisie directe",
                    badgeClass: "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                },
                {
                    title: "Groupes",
                    icon: "👥",
                    href: "/admin/groupes",
                    desc: "Répartition des groupes par session",
                    category: "saisie",
                    categoryBadge: "✍️ Saisie directe",
                    badgeClass: "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                },
                {
                    title: "Allocations",
                    icon: "💰",
                    href: "/admin/allocations",
                    desc: "Budget et types de libérations",
                    category: "saisie",
                    categoryBadge: "✍️ Saisie directe",
                    badgeClass: "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                },
                {
                    title: "Stages",
                    icon: "🏗️",
                    href: "/admin/stages",
                    desc: "Paramètres des stages par session",
                    category: "saisie",
                    categoryBadge: "✍️ Saisie directe",
                    badgeClass: "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                }
            ]
        },
        {
            id: "taches",
            group: "Affectations & Tâches (Manipulables dans la grille)",
            subtitle: "Ces éléments peuvent être visualisés ici en table, mais sont principalement manipulés dans le tableau de gestion des tâches.",
            icon: "⚡",
            badgeText: "Géré dans les tâches",
            badgeClass: "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25",
            quickLink: {
                label: "Aller à la grille des tâches",
                href: "/taches"
            },
            items: [
                {
                    title: "Charges",
                    icon: "📝",
                    href: "/admin/charges",
                    desc: "Attributions individuelles de cours (glisser-déposer dans les tâches)",
                    category: "taches",
                    categoryBadge: "⚡ Grille des tâches",
                    badgeClass: "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
                },
                {
                    title: "Libérations",
                    icon: "🔓",
                    href: "/admin/liberations",
                    desc: "Attribution des dégrèvements et congés aux enseignants",
                    category: "taches",
                    categoryBadge: "⚡ Grille des tâches",
                    badgeClass: "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
                },
                {
                    title: "Supervisions",
                    icon: "👁️",
                    href: "/admin/supervisions",
                    desc: "Attribution et suivi des stagiaires par enseignant",
                    category: "taches",
                    categoryBadge: "⚡ Grille des tâches",
                    badgeClass: "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
                },
                {
                    title: "CI Réelles",
                    icon: "📊",
                    href: "/admin/CIReelles",
                    desc: "Saisie et suivi des charges réelles effectuées",
                    category: "taches",
                    categoryBadge: "⚡ Grille des tâches",
                    badgeClass: "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
                }
            ]
        },
        {
            id: "systeme",
            group: "Configuration & Scénarios",
            subtitle: "Gestion des variantes de planification et des options générales du système.",
            icon: "⚙️",
            badgeText: "Configuration",
            badgeClass: "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25",
            items: [
                {
                    title: "Scénarios",
                    icon: "🎭",
                    href: "/admin/scenarios",
                    desc: "Gérer les variantes de planification",
                    category: "systeme",
                    categoryBadge: "⚙️ Scénario",
                    badgeClass: "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25",
                    highlight: true
                },
                {
                    title: "Paramètres",
                    icon: "🛠️",
                    href: "/admin/parametres",
                    desc: "Réglages globaux du système",
                    category: "systeme",
                    categoryBadge: "⚙️ Système",
                    badgeClass: "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25"
                }
            ]
        }
    ]

    const displayedSections = adminSections.filter(
        section => selectedCategory === "all" || section.id === selectedCategory
    )

    return (
        <div className="container py-4">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom flex-wrap gap-2">
                <div>
                    <h2 className="mb-0 fw-bold text-dark">
                        <span className="text-primary me-2">⚙️</span> Administration
                    </h2>
                    <p className="text-muted mb-0 small">
                        Gestion des données de base, des attributions de tâches et des réglages système.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-pill border shadow-sm">
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 ${selectedCategory === 'all' ? 'btn-primary fw-bold' : 'btn-light text-muted border-0'}`}
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setSelectedCategory('all')}
                    >
                        Tous
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 ${selectedCategory === 'saisie' ? 'btn-primary fw-bold' : 'btn-light text-muted border-0'}`}
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setSelectedCategory('saisie')}
                    >
                        ✍️ Données de base
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 ${selectedCategory === 'taches' ? 'btn-primary fw-bold' : 'btn-light text-muted border-0'}`}
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setSelectedCategory('taches')}
                    >
                        ⚡ Géré dans les tâches
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 ${selectedCategory === 'systeme' ? 'btn-primary fw-bold' : 'btn-light text-muted border-0'}`}
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setSelectedCategory('systeme')}
                    >
                        ⚙️ Configuration
                    </button>
                </div>
            </div>

            {/* Guide visuel / Légende */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <div className="p-3 rounded border bg-success bg-opacity-10 border-success border-opacity-25 d-flex align-items-start gap-3 h-100">
                        <div className="fs-3">✍️</div>
                        <div>
                            <h4 className="h6 fw-bold text-success mb-1">Menus de saisie directe requise</h4>
                            <p className="text-muted small mb-0">
                                <strong>Enseignants, Cours, Groupes, Allocations, Stages</strong> : ces menus doivent être utilisés pour saisir les informations préalables à la répartition.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="p-3 rounded border bg-primary bg-opacity-10 border-primary border-opacity-25 d-flex align-items-start gap-3 h-100">
                        <div className="fs-3">⚡</div>
                        <div>
                            <h4 className="h6 fw-bold text-primary mb-1">Manipulable dans le tableau des tâches</h4>
                            <p className="text-muted small mb-0">
                                <strong>Charges, Libérations, Supervisions, CI réelles</strong> : ces éléments peuvent être saisis ici, mais sont conçus pour être assignés visuellement par glisser-déposer dans la <Link href="/taches" className="fw-bold text-primary text-decoration-underline">grille des tâches</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {user?.role === 'ADMIN' && (
                <div className="mb-5">
                    <h3 className="h6 text-uppercase fw-bold text-danger mb-3 letter-spacing-1">
                        Zone Super Admin
                    </h3>
                    <div className="row g-3">
                        <div className="col-md-6 col-lg-4">
                            <Link href="/admin/super" className="text-decoration-none">
                                <div className="card h-100 border-0 shadow-sm card-hover transition-all bg-danger bg-opacity-10 border-start border-danger border-4">
                                    <div className="card-body d-flex align-items-center p-3">
                                        <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: "48px", height: "48px", fontSize: "1.5rem" }}>
                                            🔧
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="h6 fw-bold mb-1 text-danger">Console Super Admin</h4>
                                            <p className="text-muted small mb-0 text-truncate">Gérer les départements et les rôles système</p>
                                        </div>
                                        <div className="ms-auto ps-2 text-danger opacity-50">
                                            →
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
                {displayedSections.map((section) => (
                    <div key={section.id} className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <div>
                                <h3 className="h6 text-uppercase fw-bold text-dark mb-0 letter-spacing-1 d-flex align-items-center gap-2">
                                    <span>{section.icon}</span>
                                    <span>{section.group}</span>
                                    <span className={`badge rounded-pill ${section.badgeClass}`} style={{ fontSize: "0.7rem" }}>
                                        {section.badgeText}
                                    </span>
                                </h3>
                                <p className="text-muted small mb-0">{section.subtitle}</p>
                            </div>
                            {section.quickLink && (
                                <Link 
                                    href={section.quickLink.href} 
                                    className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
                                    style={{ fontSize: "0.75rem" }}
                                >
                                    <span>{section.quickLink.label}</span>
                                    <span>→</span>
                                </Link>
                            )}
                        </div>

                        <div className="row g-3">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="col-md-6 col-lg-4">
                                    <Link href={item.href} className="text-decoration-none">
                                        <div className={`card h-100 border-0 shadow-sm card-hover transition-all ${item.highlight ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : item.category === 'taches' ? 'border-start border-primary border-3' : item.category === 'saisie' ? 'border-start border-success border-3' : 'border-start border-secondary border-3'}`}>
                                          <div className="card-body d-flex flex-column p-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: "44px", height: "44px", fontSize: "1.4rem" }}>
                                                    {item.icon}
                                                </div>
                                                <div className="overflow-hidden flex-grow-1">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <h4 className={`h6 fw-bold mb-0 ${item.highlight ? 'text-primary' : 'text-dark'}`}>{item.title}</h4>
                                                        <span className="text-muted opacity-25 ms-1">→</span>
                                                    </div>
                                                    <span className={`badge rounded-pill ${item.badgeClass} mt-1`} style={{ fontSize: "0.65rem" }}>
                                                        {item.categoryBadge}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-muted small mb-0 mt-auto">{item.desc}</p>
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
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(0,0,0,0.1) !important;
                    background-color: #fff !important;
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
        </div>
    )
}
