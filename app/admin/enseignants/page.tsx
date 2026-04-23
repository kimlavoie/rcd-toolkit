'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"

export default function(){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const router = useRouter()

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>No d'employé</th>
                    <th>Nom</th>
                    <th>Courriel</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {enseignants?.map((enseignant) => (
                    <tr key={enseignant.id}>
                        <td>{enseignant.numeroEmploye}</td>
                        <td>{enseignant.prenom} {enseignant.nom}</td>
                        <td>{enseignant.courriel}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`enseignants/${enseignant.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.enseignants.delete(enseignant.id)}>🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("enseignants/ajout")}>+</button>
    </>
}