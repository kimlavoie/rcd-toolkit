'use client'

import { useAuth } from "@/app/utilities/auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Departement } from "@/app/db/db"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, activeDepartementId } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    
    const departements = useFirestoreCollection<Departement>("departements")
    
    const currentDeptId = activeDepartementId || user?.departementId;

    const departementName = useMemo(() => {
        if (!currentDeptId || !departements) return null
        return departements.find(d => d.id === currentDeptId)?.nom
    }, [currentDeptId, departements])

    const displayRole = user?.role === 'ADMIN' ? 'Super Admin' : (user?.role === 'COORDONNATEUR' ? 'Coordonnateur' : 'Enseignant');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (user.role === 'ENSEIGNANT') {
                router.push("/")
            }
        }
    }, [user, loading, router])

    if (loading) {
        return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>
    }

    if (!user || user.role === 'ENSEIGNANT') {
        return null // Will redirect
    }

    return (
        <>
            <div className="bg-dark text-white p-2 d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold">
                    <span className="me-2">🛡️</span>
                    Administration {user.role === 'ADMIN' ? 'Super Admin ' : (user.isActualAdmin ? `(${displayRole}) ` : '')}
                    {currentDeptId ? `(Département: ${departementName || currentDeptId})` : (user.role !== 'ADMIN' ? '(Aucun département)' : '')}
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <Link href="/profil" className="btn btn-sm btn-outline-info text-white border-white">👤 Mon Profil</Link>
                    <Link href="/" className="btn btn-sm btn-outline-light">Quitter l'administration</Link>
                </div>
            </div>
            {children}
        </>
    )
}
