'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"

export default function(){
    const allocations = useLiveQuery(() => db.allocations.toArray())

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
                    <th>Code</th>
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {allocations?.filter((allocation) => {
                    return allocation?.session == params.session
                })?.map((allocation) => {
                    return <tr key={allocation.id}>
                        <td>{allocation.code}</td>
                        <td>{allocation.description}</td>
                        <td>{allocation.quantite}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/${allocation.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.allocations.delete(allocation.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/ajout`)}>+</button>
    </>
}