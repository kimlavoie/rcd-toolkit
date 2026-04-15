'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"

export default function(){
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    const router = useRouter()

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
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`liberations/${liberation.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.liberations.delete(liberation.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("liberations/ajout")}>+</button>
    </>
}