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
        <ul>
            {supervisions?.map((supervision) => {
                const stage = stages?.find((el) => el.id == supervision.stage)
                const session = sessions?.find((el) => el.id == stage?.session)
                const enseignant = enseignants?.find((el) => el.id == supervision.enseignant)
                return <li key={supervision.id}>
                    <p>Session du stage: {session?.saison} {session?.annee}</p>
                    <p>Enseignant: {enseignant?.prenom} {enseignant?.nom}</p> 
                    <p>Nombre de stagiaires: {supervision.nbStagiaires}</p>
                    <p>
                        <Link href={`supervisions/${supervision.id}`}>Modifier</Link>
                        <button onClick={() => db.supervisions.delete(supervision.id)}>Supprimer</button>
                    </p>
                </li>
            })}
        </ul>
    </>
}