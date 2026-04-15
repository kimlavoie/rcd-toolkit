'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"



export default function(){
    const priorites = useLiveQuery(() => db.priorites.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    const router = useRouter()

    return <>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Enseignant</th>
                    <th>Cours</th>
                    <th>Session de début</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {priorites?.map((priorite) => {
                    const enseignant = enseignants?.find((el) => el.id == priorite.enseignant)
                    const cour = cours?.find((el) => el.id == priorite.cours)
                    const session = sessions?.find((el) => el.id == priorite.sessionDebut)
                    return <tr key={priorite.id}>
                        <td>{enseignant?.prenom} {enseignant?.nom}</td>
                        <td>{cour?.sigle} {cour?.nom}</td>
                        <td>{session?.saison} {session?.annee}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`priorites/${priorite.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.priorites.delete(priorite.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("priorites/ajout")}>+</button>
    </>
}