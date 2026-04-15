'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"



export default function(){
    const priorites = useLiveQuery(() => db.priorites.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href="priorites/ajout">Ajouter une priorité</Link>
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
                            <Link href={`priorites/${priorite.id}`}>Modifier</Link>
                            <button onClick={() => db.priorites.delete(priorite.id)}>Supprimer</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
    </>
}