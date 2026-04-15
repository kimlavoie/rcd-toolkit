'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"

export default function(){
    const cours = useLiveQuery(() => db.cours.toArray())

    return <>
        <Link href="cours/ajout">Ajouter un cours</Link>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Sigle</th>
                    <th>Nom</th>
                    <th>Saison</th>
                    <th>Pondération</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {cours?.map((cour) => (
                    <tr key={cour.id}>
                        <td>{cour.sigle}</td>
                        <td>{cour.nom}</td>
                        <td>{cour.saison}</td>
                        <td>{cour.heuresTheorie}-{cour.heuresPratique}-{cour.heuresMaison}</td>
                        <td>
                            <Link href={`cours/${cour.id}`}>Modifier</Link>
                            <button onClick={() => db.cours.delete(cour.id)}>Supprimer</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </>
}