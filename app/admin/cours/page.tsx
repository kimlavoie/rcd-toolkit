'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"

export default function(){
    const cours = useLiveQuery(() => db.cours.toArray())
    const router = useRouter()

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Sigle</th>
                    <th>Nom</th>
                    <th>Saison</th>
                    <th>Couleur</th>
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
                        <td><div style={{backgroundColor: cour.couleur, width: "60px", height: "30px"}}></div></td>
                        <td>{cour.heuresTheorie}-{cour.heuresPratique}-{cour.heuresMaison}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`cours/${cour.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.cours.delete(cour.id)}>🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`cours/ajout`)}>+</button>
    </>
}