'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"

export default function(){
    const sessions = useLiveQuery(() => db.sessions.toArray())

    const router = useRouter()

    return <>
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
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`sessions/${session.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.sessions.delete(session.id)}>🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("sessions/ajout")}>+</button>
    </>
}