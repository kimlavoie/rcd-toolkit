'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../utilities/auth"

export default function(){
    const { user, loading } = useAuth()
    const router = useRouter()

    if (loading) return <div className="container mt-5 text-center">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push("/")}>← Retour</button>  
        <div className="list-group">
            <Link href="admin/enseignants" className="list-group-item list-group-item-action">Gestion des enseignants</Link>
            <Link href="admin/cours" className="list-group-item list-group-item-action">Gestion des cours</Link>
            <Link href="admin/groupes" className="list-group-item list-group-item-action">Gestion des groupes</Link>
            <Link href="admin/allocations" className="list-group-item list-group-item-action">Gestion des allocations</Link>
            <Link href="admin/liberations" className="list-group-item list-group-item-action">Gestion des libérations</Link>
            <Link href="admin/stages" className="list-group-item list-group-item-action">Gestion des stages</Link>
            <Link href="admin/supervisions" className="list-group-item list-group-item-action">Gestion des supervisions</Link>
            <Link href="admin/charges" className="list-group-item list-group-item-action">Gestion des charges</Link> 
            <Link href="admin/CIReelles" className="list-group-item list-group-item-action">Gestion des CI Réelles</Link>
        </div>
    </div>
}