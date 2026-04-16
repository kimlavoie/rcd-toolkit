'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"

export default function(){
    const params = useParams()
    const router = useRouter()

    const charges = useLiveQuery(() => db.charges.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const coursListe = useLiveQuery(() => db.cours.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    const session = sessions?.find((el) => el.id == Number(params.session))

    return <>
        <h1>{session?.saison} {session?.annee}</h1>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Enseignant</th>
                    <th>Groupe</th>
                    <th>Nombre de semaines</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {charges?.filter((charge) => {
                    const groupe = groupes?.find((el) => el.id == charge?.groupe)
                    return groupe?.session == Number(params.session)
                })?.map((charge) => {
                    const enseignant = enseignants?.find((el) => el.id == charge.enseignant)
                    const groupe = groupes?.find((el) => el.id == charge?.groupe)
                    const cours = coursListe?.find((el) => el.id == groupe?.cours)
                    const session = sessions?.find((el) => el.id == groupe?.session)
                    return <tr key={charge.id}>
                        <td>{enseignant?.prenom} {enseignant?.nom}</td>
                        <td>{cours?.sigle} - {cours?.nom} ({groupe?.nbEtudiants})</td>
                        <td>{charge.nbSemaines}</td>
                        <td>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/${charge.id}`)}>✏️</button>
                            <button type="button" className="btn btn-primary rounded-pill" onClick={() => db.charges.delete(charge.id)}>🗑️</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(`${params.session}/ajout`)}>+</button>
    </>
}