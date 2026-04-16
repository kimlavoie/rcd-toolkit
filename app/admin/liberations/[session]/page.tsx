'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"

export default function(){
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    const router = useRouter()
    const params = useParams()

    const sessions = useLiveQuery(() => db.sessions.toArray())
    const session = sessions?.find((el) => el.id == Number(params.session))

    return <>
        <h1>{session?.saison} {session?.annee}</h1>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Enseignant</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {liberations?.filter((liberation) => {
                    return liberation?.session == Number(params.session)
                })?.map((liberation) => {
                    const enseignant = enseignants?.find((el) => el.id == liberation.enseignant)
                    return <tr key={liberation.id}>
                        <td>{liberation.code}</td>
                        <td>{liberation.description}</td>
                        <td>{liberation.quantite}</td>
                        <td>{enseignant?.prenom} {enseignant?.nom}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`liberations/${liberation.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.liberations.delete(liberation.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/ajout`)}>+</button>
    </>
}