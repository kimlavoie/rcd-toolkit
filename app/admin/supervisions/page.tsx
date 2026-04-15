'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"



export default function(){
    const supervisions = useLiveQuery(() => db.supervisions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href="supervisions/ajout">Ajouter une supervision</Link>
        <table className="table table-striped">
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
                                <Link href={`supervisions/${supervision.id}`}>Modifier</Link>
                                <button onClick={() => db.supervisions.delete(supervision.id)}>Supprimer</button>
                            </td>
                        </tr>
                    })
                }
            </tbody>
        </table>
    </>
}