'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href="sessions/ajout">Ajouter une session</Link>
        <ul>
            {sessions?.map((session) => (
                <li key={session.id}>
                    <p>Saison: {session.saison}</p> 
                    <p>Année: {session.annee}</p>
                    <p>
                        <Link href={`sessions/${session.id}`}>Modifier</Link>
                        <button onClick={() => db.sessions.delete(session.id)}>Supprimer</button>
                    </p>
                </li>
            ))}
        </ul>
    </>
}