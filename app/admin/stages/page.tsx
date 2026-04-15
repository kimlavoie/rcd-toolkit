'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"


export default function(){
    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    const router = useRouter()

    return <>
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
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`stages/${stage.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.stages.delete(stage.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("stages/ajout")}>+</button>
    </>
}