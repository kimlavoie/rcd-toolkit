'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"

export default function(){
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    const router = useRouter()
    const params = useParams()

    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Allocation</th>
                    <th>Enseignant</th>
                    <th>Quantité</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {liberations?.filter((liberation) => {
                    const allocation = allocations?.find((allocation) => allocation.id == liberation.allocation)
                    return allocation?.session == params.session
                })?.map((liberation) => {
                    const allocation = allocations?.find((allocation) => allocation.id == liberation.allocation)
                    const enseignant = enseignants?.find((enseignant) => enseignant.id == liberation.enseignant)
                    return <tr key={liberation.id}>
                        <td>{allocation?.code} - {allocation?.description}({allocation?.quantite})</td>
                        <td>{enseignant?.prenom} {enseignant?.nom}</td>
                        <td>{liberation.quantite}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/${liberation.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.allocations.delete(liberation.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/ajout`)}>+</button>
    </>
}