'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"



export default function(){
    const supervisions = useLiveQuery(() => db.supervisions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    const router = useRouter()

    return <>
        <Link href="supervisions/ajout">Ajouter une supervision</Link>        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Session du stage</th>
                    <th>Enseignant</th>
                    <th>Nombre de stagiaires</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {
                    supervisions?.map((supervision) => {
                        const stage = stages?.find((el) => el.id == supervision.stage)
                        const session = sessions?.find((el) => el.id == stage?.session)
                        const enseignant = enseignants?.find((el) => el.id == supervision.enseignant)
                        return <tr key={supervision.id}>
                            <td>{session?.saison} {session?.annee}</td>
                            <td>{enseignant?.prenom} {enseignant?.nom}</td>
                            <td>{supervision.nbStagiaires}</td>
                            <td>
                                <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`supervisions/${supervision.id}`)}>✏️</button>
                                <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.supervisions.delete(supervision.id)}>🗑️</button>
                            </td>
                        </tr>
                    })
                }
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("supervisions/ajout")}>+</button>
    </>
}