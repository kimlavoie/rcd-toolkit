'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    return <>
        <Link href="enseignants/ajout">Ajouter un enseignant</Link>
        <ul>
            {enseignants?.map((enseignant) => (
                <li key={enseignant.id}>
                    <p>No d'employé: {enseignant.numeroEmploye}</p> 
                    <p>Nom: {enseignant.prenom} {enseignant.nom}</p> 
                    <p>Courriel: {enseignant.courriel}</p>
                    <p>
                        <Link href={`enseignants/${enseignant.id}`}>Modifier</Link>
                        <button onClick={() => db.enseignants.delete(enseignant.id)}>Supprimer</button>
                    </p>
                </li>
            ))}
        </ul>
    </>
}