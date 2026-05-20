'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"
import SelectGroupe from "../../components/inputs/SelectGroupe"
import { useAuth } from "@/app/utilities/auth"
import type { Charge, Enseignant, Groupe, Cours } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { useMemo } from "react"
import { toast } from "react-hot-toast"

export default function(){
    const { user, loading } = useAuth()
    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const charges = useFirestoreCollection<Charge>("charges")
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const coursListe = useFirestoreCollection<Cours>("cours")

    const enrichedCharges = useMemo(() => {
        return (charges ?? []).filter(c => {
            const groupe = groupes?.find(g => g.id === c.groupe)
            return groupe?.session === session
        }).map(c => {
            const ens = enseignants?.find(e => e.id === c.enseignant)
            const grp = groupes?.find(g => g.id === c.groupe)
            const crs = coursListe?.find(co => co.id === grp?.cours)
            return {
                ...c,
                enseignantNom: ens ? `${ens.prenom} ${ens.nom}` : "",
                groupeNom: crs ? `${crs.sigle} - ${crs.nom}` : "",
            }
        })
    }, [charges, enseignants, groupes, coursListe, session])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(enrichedCharges, "enseignantNom")
    
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: "", groupe: "", nbSemaines: 15 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(charge: any) {
        setEditingId(charge.id)
        setEditData({ ...charge })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.charges.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.groupe) {
            await firebaseDb.charges.add(newData)
            setNewData({ ...newData, enseignant: "", groupe: "" })
        } else {
            toast.error("L'enseignant et le groupe sont requis.")
        }
    }

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push(".")}>← Retour</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("enseignantNom")} style={{cursor: "pointer"}}>Enseignant {getSortIcon("enseignantNom")}</th>
                    <th onClick={() => toggleSort("groupeNom")} style={{cursor: "pointer"}}>Groupe {getSortIcon("groupeNom")}</th>
                    <th onClick={() => toggleSort("nbSemaines")} style={{cursor: "pointer"}}>Nombre de semaines {getSortIcon("nbSemaines")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((charge) => {
                    const enseignant = enseignants?.find((el) => el.id == charge.enseignant)
                    const groupe = groupes?.find((el) => el.id == charge?.groupe)
                    const cours = coursListe?.find((el) => el.id == groupe?.cours)
                    
                    return <tr key={charge.id}>
                        {editingId === charge.id ? (
                            <>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: val})} />
                                </td>
                                <td>
                                    <SelectGroupe value={editData.groupe} session={session} onChange={(val:any) => setEditData({...editData, groupe: val})} />
                                </td>
                                <td>
                                    <input type="number" className="form-control" value={editData.nbSemaines} onChange={e => setEditData({...editData, nbSemaines: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{cours?.sigle} - {cours?.nom} ({groupe?.nbEtudiants})</td>
                                <td>{charge.nbSemaines}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(charge)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.charges.delete(charge.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: val})} />
                    </td>
                    <td>
                        <SelectGroupe value={newData.groupe} session={session} onChange={(val:any) => setNewData({...newData, groupe: val})} />
                    </td>
                    <td>
                        <input type="number" className="form-control" placeholder="Semaines" value={newData.nbSemaines} onChange={e => setNewData({...newData, nbSemaines: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}