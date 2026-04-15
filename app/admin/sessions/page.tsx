'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href="sessions/ajout">Ajouter une session</Link>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Saison</th>
                    <th>Année</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sessions?.map((session) => (
                    <tr key={session.id}>
                        <td>{session.saison}</td>
                        <td>{session.annee}</td>
                        <td>
                            <Link href={`sessions/${session.id}`}>Modifier</Link>
                            <button onClick={() => db.sessions.delete(session.id)}>Supprimer</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </>
}