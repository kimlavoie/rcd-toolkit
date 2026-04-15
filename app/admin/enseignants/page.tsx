'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    return <>
        <Link href="enseignants/ajout">Ajouter un enseignant</Link>
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
                            <Link href={`enseignants/${enseignant.id}`}>Modifier</Link>
                            <button onClick={() => db.enseignants.delete(enseignant.id)}>Supprimer</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </>
}