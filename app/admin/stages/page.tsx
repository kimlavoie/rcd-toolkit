'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"


export default function(){
    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href="stages/ajout">Ajouter un stage</Link>
        <ul>
            {stages?.map((stage) => {
                const session = sessions?.find((el) => el.id == stage.session)

                return <li key={stage.id}>
                    <p>Session: {session?.saison} {session?.annee}</p> 
                    <p>ETC par stagiaire: {stage.ETCparStagiaire} ETC</p> 
                    <p>Nombre de stagiaires: {stage.nbStagiaires}</p>
                    <p>
                        <Link href={`stages/${stage.id}`}>Modifier</Link>
                        <button onClick={() => db.stages.delete(stage.id)}>Supprimer</button>
                    </p>
                </li>
            }
                
            )}
        </ul>
    </>
}