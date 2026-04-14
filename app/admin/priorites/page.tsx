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
        <ul>
            {priorites?.map((priorite) => {
                const enseignant = enseignants?.find((el) => el.id == priorite.enseignant)
                const cour = cours?.find((el) => el.id == priorite.cours)
                const session = sessions?.find((el) => el.id == priorite.sessionDebut)


                return <li key={priorite.id}>
                    <p>Enseignant: {enseignant?.prenom} {enseignant?.nom}</p> 
                    <p>Cours: {cour?.sigle} {cour?.nom}</p> 
                    <p>Session de début: {session?.saison} {session?.annee}</p>
                    <p>
                        <Link href={`priorites/${priorite.id}`}>Modifier</Link>
                        <button onClick={() => db.priorites.delete(priorite.id)}>Supprimer</button>
                    </p>
                </li>
            })}
        </ul>
    </>
}