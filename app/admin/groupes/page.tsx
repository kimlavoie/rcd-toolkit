'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())

    function render(){
        return <>
        <Link href="groupes/ajout">Ajouter un groupe</Link>
        <ul>
            {groupes?.map((groupe) => {
                const session = sessions?.find((el) => el.id == groupe.id)
                const cour = cours?.find((el) => el.id == groupe.id)
                
                return <li key={groupe.id}>
                    <p>Session: {session?.saison} {session?.annee}</p> 
                    <p>Cours: {cour?.sigle} {cour?.nom}</p> 
                    <p>Nombre d'étudiants: {groupe.nbEtudiants}</p>
                    <p>
                        <Link href={`groupes/${groupe.id}`}>Modifier</Link>
                        <button onClick={() => db.groupes.delete(groupe.id)}>Supprimer</button>
                    </p>
                </li>
            }  
            )}
        </ul>
    </>
    }

    return render()
}