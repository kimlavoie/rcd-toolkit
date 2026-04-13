'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    return <>
        <Link href="liberations/ajout">Ajouter une libération</Link>
        <ul>
            {liberations?.map((liberation) => {
                const session = sessions?.find((el) => el.id == liberation.session)
                const enseignant = enseignants?.find((el) => el.id == liberation.enseignant)
                return <li key={liberation.id}>
                    <p>Code: {liberation.code}</p> 
                    <p>Description: {liberation.description}</p> 
                    <p>Quantité: {liberation.quantite}</p>
                    <p>Session: {session?.saison} {session?.annee}</p> 
                    <p>Enseignant: {enseignant?.prenom} {enseignant?.nom}</p>
                    <p>
                        <Link href={`liberations/${liberation.id}`}>Modifier</Link>
                        <button onClick={() => db.liberations.delete(liberation.id)}>Supprimer</button>
                    </p>
                </li>
        })}
        </ul>
    </>
}