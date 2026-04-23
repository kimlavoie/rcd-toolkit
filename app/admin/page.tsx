'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function(){
    const router = useRouter()

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <p><Link href="admin/enseignants">Gestion des enseignants</Link></p>
        <p><Link href="admin/cours">Gestion des cours</Link></p>
        <p><Link href="admin/groupes">Gestion des groupes</Link></p>
        <p><Link href="admin/allocations">Gestion des allocations</Link></p>
        <p><Link href="admin/liberations">Gestion des libérations</Link></p>
        <p><Link href="admin/priorites">Gestion des priorités</Link></p>
        <p><Link href="admin/stages">Gestion des stages</Link></p>
        <p><Link href="admin/supervisions">Gestion des supervisions</Link></p>
        <p><Link href="admin/charges">Gestion des charges</Link></p> 
    </>
}