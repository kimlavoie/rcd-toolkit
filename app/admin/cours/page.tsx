'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const cours = useLiveQuery(() => db.cours.toArray())

    return <>
        <Link href="cours/ajout">Ajouter un cours</Link>
        <ul>
            {cours?.map((cour) => (
                <li key={cour.id}>
                    <p>Sigle: {cour.sigle}</p> 
                    <p>Nom: {cour.nom}</p> 
                    <p>Pondération: {cour.heuresTheorie}-{cour.heuresPratique}-{cour.heuresMaison}</p>
                    <p>
                        <Link href={`cours/${cour.id}`}>Modifier</Link>
                        <button onClick={() => db.cours.delete(cour.id)}>Supprimer</button>
                    </p>
                </li>
            ))}
        </ul>
    </>
}