'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectCours from "../../components/inputs/SelectCours"
import { useAuth } from "@/app/utilities/auth"
import type { Groupe, Cours } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { useMemo } from "react"
import { toast } from "react-hot-toast"

function GroupesPageContent(){
    const { user, loading } = useAuth()
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const cours = useFirestoreCollection<Cours>("cours")

    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get("highlight")
    
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const enrichedGroupes = useMemo(() => {
        return (groupes ?? []).filter(g => g.session === session).map(g => {
            const cour = cours?.find(c => c.id === g.cours)
            return {
                ...g,
                coursNom: cour ? `${cour.sigle} - ${cour.nom}` : "",
            }
        })
    }, [groupes, cours, session])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(enrichedGroupes, "coursNom")
    
    useEffect(() => {
        if (highlightId) {
            const element = document.getElementById(`row-${highlightId}`)
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }
    }, [highlightId, sortedData])

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ cours: "", nbEtudiants: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(groupe: any) {
        setEditingId(groupe.id)
        setEditData({ ...groupe })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.groupes.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.cours) {
            await firebaseDb.groupes.add({ ...newData, session })
            setNewData({ cours: "", nbEtudiants: 0 })
        } else {
            toast.error("Le cours est requis.")
        }
    }

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push(".")}>← Retour</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("coursNom")} style={{cursor: "pointer"}}>Cours {getSortIcon("coursNom")}</th>
                    <th onClick={() => toggleSort("nbEtudiants")} style={{cursor: "pointer"}}>Nombre d'étudiants {getSortIcon("nbEtudiants")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((groupe) => {
                    const cour = cours?.find((el) => el.id == groupe.cours)
                    const isHighlighted = highlightId === groupe.id
                    
                    return <tr key={groupe.id} id={`row-${groupe.id}`} className={isHighlighted ? "table-warning border border-warning" : ""}>
                        {editingId === groupe.id ? (
                            <>
                                <td>
                                    <SelectCours value={editData.cours} onChange={(val:any) => setEditData({...editData, cours: val})} saison={saison} />
                                </td>
                                <td>
                                    <input type="number" className="form-control" value={editData.nbEtudiants} onChange={e => setEditData({...editData, nbEtudiants: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{cour?.sigle} - {cour?.nom}</td> 
                                <td>{groupe.nbEtudiants}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(groupe)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.groupes.delete(groupe.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectCours value={newData.cours} onChange={(val:any) => setNewData({...newData, cours: val})} saison={saison} />
                    </td>
                    <td>
                        <input type="number" className="form-control" placeholder="Étudiants" value={newData.nbEtudiants} onChange={e => setNewData({...newData, nbEtudiants: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function GroupesPage() {
    return (
        <Suspense fallback={<div className="container mt-5">Chargement...</div>}>
            <GroupesPageContent />
        </Suspense>
    )
}