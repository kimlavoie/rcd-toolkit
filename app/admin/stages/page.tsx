'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"


export default function(){
    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href="stages/ajout">Ajouter un stage</Link>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Session</th>
                    <th>ETC par stagiaire</th>
                    <th>Nombre de stagiaires</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {stages?.map((stage) => {
                    const session = sessions?.find((el) => el.id == stage.session)
                    return <tr key={stage.id}>
                        <td>{session?.saison} {session?.annee}</td>
                        <td>{stage.ETCparStagiaire}</td>
                        <td>{stage.nbStagiaires}</td>
                        <td>
                            <Link href={`stages/${stage.id}`}>Modifier</Link>
                            <button onClick={() => db.stages.delete(stage.id)}>Supprimer</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
    </>
}