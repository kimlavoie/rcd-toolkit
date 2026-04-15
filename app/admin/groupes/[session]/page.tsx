'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"

export default function(){
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())

    const params = useParams()

    const router = useRouter()

    return <>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Session</th>
                    <th>Cours</th>
                    <th>Nombre d'étudiants</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {groupes?.filter((groupe) => groupe?.session == Number(params.session))?.map((groupe) => {
                    const session = sessions?.find((el) => el.id == groupe.session)
                    const cour = cours?.find((el) => el.id == groupe.cours)
                    
                    return <tr key={groupe.id}>
                        <td>{session?.saison} {session?.annee}</td> 
                        <td>{cour?.sigle} {cour?.nom}</td> 
                        <td>{groupe.nbEtudiants}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/${groupe.id}`)}>✏️</button>
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
