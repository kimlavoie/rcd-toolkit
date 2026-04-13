'use client'

import Link from "next/link"

export default function(){
    return <>
        <p><Link href="admin/enseignants">Gestion des enseignants</Link></p>
        <p><Link href="admin/cours">Gestion des cours</Link></p>
        <p><Link href="admin/groupes">Gestion des groupes</Link></p>
        <p><Link href="admin/liberations">Gestion des libérations</Link></p>
        <p><Link href="admin/priorites">Gestion des priorités</Link></p>
        <p><Link href="admin/sessions">Gestion des sessions</Link></p>
        <p><Link href="admin/stages">Gestion des stages</Link></p>
        <p><Link href="admin/supervisions">Gestion des supervisions</Link></p>
        
    </>
}