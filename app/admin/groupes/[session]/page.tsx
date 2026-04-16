'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"

export default function(){
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())

    const params = useParams()

    const router = useRouter()

    
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    return <>
        <h1>{saison} {annee}</h1>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Cours</th>
                    <th>Nombre d'étudiants</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {groupes?.filter((groupe) => groupe?.session == session)?.map((groupe) => {
                    
                    const cour = cours?.find((el) => el.id == groupe.cours)
                    
                    return <tr key={groupe.id}>
                        <td>{cour?.sigle} {cour?.nom}</td> 
                        <td>{groupe.nbEtudiants}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${session}/${groupe.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.groupes.delete(groupe.id)}>🗑️</button>
                        </td>
                    </tr>
                }  
                )}
            </tbody>
            
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/ajout`)}>+</button>
    </>
}
