'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"



export default function(){
    const supervisions = useLiveQuery(() => db.supervisions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())

    const router = useRouter()

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>       
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Session du stage</th>
                    <th>Enseignant</th>
                    <th>Nombre de stagiaires</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {
                    supervisions?.map((supervision) => {
                        const stage = stages?.find((el) => el.id == supervision.stage)
                        const enseignant = enseignants?.find((el) => el.id == supervision.enseignant)
                        const {saison, annee} = extractSessionInfos(stage?.session ?? "A26")
                        return <tr key={supervision.id}>
                            <td>{saison} {annee}</td>
                            <td>{enseignant?.prenom} {enseignant?.nom}</td>
                            <td>{supervision.nbStagiaires}</td>
                            <td>
                                <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`supervisions/${supervision.id}`)}>✏️</button>
                                <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.supervisions.delete(supervision.id)}>🗑️</button>
                            </td>
                        </tr>
                    })
                }
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push("supervisions/ajout")}>+</button>
    </>
}