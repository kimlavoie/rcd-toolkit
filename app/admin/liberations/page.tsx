'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    return <>
        <Link href="liberations/ajout">Ajouter une libération</Link>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Session</th>
                    <th>Enseignant</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {liberations?.map((liberation) => {
                    const session = sessions?.find((el) => el.id == liberation.session)
                    const enseignant = enseignants?.find((el) => el.id == liberation.enseignant)
                    return <tr key={liberation.id}>
                        <td>{liberation.code}</td>
                        <td>{liberation.description}</td>
                        <td>{liberation.quantite}</td>
                        <td>{session?.saison} {session?.annee}</td>
                        <td>{enseignant?.prenom} {enseignant?.nom}</td>
                        <td>
                            <Link href={`liberations/${liberation.id}`}>Modifier</Link>
                            <button onClick={() => db.liberations.delete(liberation.id)}>Supprimer</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
    </>
}