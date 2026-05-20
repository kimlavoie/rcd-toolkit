'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/app/utilities/auth"
import type { Enseignant } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"

function EnseignantsPageContent(){
    const { user, loading } = useAuth()
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get("highlight")
    
    const { sortedData, toggleSort, getSortIcon } = useTableSort(enseignants, "nom")

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
    const [newData, setNewData] = useState({ numeroEmploye: "", prenom: "", nom: "", courriel: "" })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(enseignant: any) {
        setEditingId(enseignant.id)
        setEditData({ ...enseignant })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.enseignants.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.numeroEmploye && newData.nom) {
            await firebaseDb.enseignants.add(newData)
            setNewData({ numeroEmploye: "", prenom: "", nom: "", courriel: "" })
        } else {
            toast.error("Le numéro d'employé et le nom sont requis.")
        }
    }

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push(".")}>← Retour</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("numeroEmploye")} style={{cursor: "pointer"}}>No d'employé {getSortIcon("numeroEmploye")}</th>
                    <th onClick={() => toggleSort("prenom")} style={{cursor: "pointer"}}>Prénom {getSortIcon("prenom")}</th>
                    <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom {getSortIcon("nom")}</th>
                    <th onClick={() => toggleSort("courriel")} style={{cursor: "pointer"}}>Courriel {getSortIcon("courriel")}</th>
                    <th style={{width: "150px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((enseignant) => {
                    const isHighlighted = highlightId === enseignant.id
                    return <tr key={enseignant.id} id={`row-${enseignant.id}`} className={isHighlighted ? "table-warning border border-warning" : ""}>
                        {editingId === enseignant.id ? (
                            <>
                                <td><input className="form-control" value={editData.numeroEmploye} onChange={e => setEditData({...editData, numeroEmploye: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.prenom} onChange={e => setEditData({...editData, prenom: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.courriel} onChange={e => setEditData({...editData, courriel: e.target.value})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant.numeroEmploye}</td>
                                <td>{enseignant.prenom}</td>
                                <td>{enseignant.nom}</td>
                                <td>{enseignant.courriel}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(enseignant)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.enseignants.delete(enseignant.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td><input className="form-control" placeholder="Nouveau..." value={newData.numeroEmploye} onChange={e => setNewData({...newData, numeroEmploye: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Prénom" value={newData.prenom} onChange={e => setNewData({...newData, prenom: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Nom" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Courriel" value={newData.courriel} onChange={e => setNewData({...newData, courriel: e.target.value})} /></td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function EnseignantsPage() {
    return (
        <Suspense fallback={<div className="container mt-5">Chargement...</div>}>
            <EnseignantsPageContent />
        </Suspense>
    )
}