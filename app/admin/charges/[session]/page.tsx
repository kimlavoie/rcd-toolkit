'use client'

import { useLiveQuery } from "dexie-react-hooks"
import Link from "next/link"
import { db } from "@/app/db/db"
import { useParams } from "next/navigation"

export default function(){
    const params = useParams()

    const charges = useLiveQuery(() => db.charges.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const coursListe = useLiveQuery(() => db.cours.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <Link href={`${params.session}/ajout`}>Ajouter une charge</Link>
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
                        <td>{cours?.sigle} - {cours?.nom}</td>
                        <td>{charge.nbSemaines}</td>
                        <td>
                            <Link href={`${params.session}/${charge.id}`}>Modifier</Link>
                            <button onClick={() => db.charges.delete(charge.id)}>Supprimer</button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
    </>
}