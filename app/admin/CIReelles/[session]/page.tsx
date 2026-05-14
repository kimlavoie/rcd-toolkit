'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"

export default function(){
    const CIReelles = useLiveQuery(() => db.CIReelles.toArray())

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
                    <th>Enseignant</th>
                    <th>CI</th>
                </tr>
            </thead>
            <tbody>
                {CIReelles?.filter((CIReelle) => {
                    return CIReelle?.session == params.session
                })?.map((CIReelle) => {
                    return <tr key={CIReelle.id}>
                        <td>{CIReelle.enseignant}</td>
                        <td>{CIReelle.CI}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/${CIReelle.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.CIReelles.delete(CIReelle.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/ajout`)}>+</button>
    </>
}