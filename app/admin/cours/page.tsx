'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/app/utilities/auth"
import type { Cours } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"

function CoursPageContent(){
    const { user, loading } = useAuth()
    const cours = useFirestoreCollection<Cours>("cours")
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get("highlight")
    
    const { sortedData, toggleSort, getSortIcon } = useTableSort(cours, "sigle")

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
    const [newData, setNewData] = useState({ sigle: "", nom: "", saison: "Automne", couleur: "#000000", heuresTheorie: 0, heuresPratique: 0, heuresMaison: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(cour: any) {
        setEditingId(cour.id)
        setEditData({ ...cour })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.cours.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.sigle && newData.nom) {
            await firebaseDb.cours.add(newData)
            setNewData({ sigle: "", nom: "", saison: "Automne", couleur: "#000000", heuresTheorie: 0, heuresPratique: 0, heuresMaison: 0 })
        } else {
            toast.error("Le sigle et le nom sont requis.")
        }
    }

    return <div className="container mt-3">
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("sigle")} style={{cursor: "pointer"}}>Sigle {getSortIcon("sigle")}</th>
                    <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom {getSortIcon("nom")}</th>
                    <th onClick={() => toggleSort("saison")} style={{cursor: "pointer"}}>Saison {getSortIcon("saison")}</th>
                    <th onClick={() => toggleSort("couleur")} style={{cursor: "pointer"}}>Couleur {getSortIcon("couleur")}</th>
                    <th onClick={() => toggleSort("heuresTheorie")} style={{cursor: "pointer"}}>Théorie {getSortIcon("heuresTheorie")}</th>
                    <th onClick={() => toggleSort("heuresPratique")} style={{cursor: "pointer"}}>Pratique {getSortIcon("heuresPratique")}</th>
                    <th onClick={() => toggleSort("heuresMaison")} style={{cursor: "pointer"}}>Maison {getSortIcon("heuresMaison")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((cour) => {
                    const isHighlighted = highlightId === cour.id
                    return <tr key={cour.id} id={`row-${cour.id}`} className={isHighlighted ? "table-warning border border-warning" : ""}>
                        {editingId === cour.id ? (
                            <>
                                <td><input className="form-control" value={editData.sigle} onChange={e => setEditData({...editData, sigle: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                <td>
                                    <select className="form-select" value={editData.saison} onChange={e => setEditData({...editData, saison: e.target.value})}>
                                        <option value="Automne">Automne</option>
                                        <option value="Hiver">Hiver</option>
                                    </select>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <input type="color" className="form-control form-control-color me-1" value={editData.couleur} onChange={e => setEditData({...editData, couleur: e.target.value})} />
                                        <input className="form-control form-control-sm" style={{width: "80px"}} value={editData.couleur} onChange={e => setEditData({...editData, couleur: e.target.value})} />
                                    </div>
                                </td>
                                <td><input type="number" className="form-control" value={editData.heuresTheorie} onChange={e => setEditData({...editData, heuresTheorie: Number(e.target.value)})} /></td>
                                <td><input type="number" className="form-control" value={editData.heuresPratique} onChange={e => setEditData({...editData, heuresPratique: Number(e.target.value)})} /></td>
                                <td><input type="number" className="form-control" value={editData.heuresMaison} onChange={e => setEditData({...editData, heuresMaison: Number(e.target.value)})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{cour.sigle}</td>
                                <td>{cour.nom}</td>
                                <td>{cour.saison}</td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div style={{width: "20px", height: "20px", backgroundColor: cour.couleur, border: "1px solid #ccc", marginRight: "5px"}}></div>
                                        {cour.couleur}
                                    </div>
                                </td>
                                <td>{cour.heuresTheorie}h</td>
                                <td>{cour.heuresPratique}h</td>
                                <td>{cour.heuresMaison}h</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(cour)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.cours.delete(cour.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td><input className="form-control" placeholder="Sigle" value={newData.sigle} onChange={e => setNewData({...newData, sigle: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Nom du cours" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td>
                        <select className="form-select" value={newData.saison} onChange={e => setNewData({...newData, saison: e.target.value})}>
                            <option value="Automne">Automne</option>
                            <option value="Hiver">Hiver</option>
                        </select>
                    </td>
                    <td>
                        <div className="d-flex align-items-center">
                            <input type="color" className="form-control form-control-color me-1" value={newData.couleur} onChange={e => setNewData({...newData, couleur: e.target.value})} />
                            <input className="form-control form-control-sm" style={{width: "80px"}} value={newData.couleur} onChange={e => setNewData({...newData, couleur: e.target.value})} />
                        </div>
                    </td>
                    <td><input type="number" className="form-control" placeholder="Théorie" value={newData.heuresTheorie} onChange={e => setNewData({...newData, heuresTheorie: Number(e.target.value)})} /></td>
                    <td><input type="number" className="form-control" placeholder="Pratique" value={newData.heuresPratique} onChange={e => setNewData({...newData, heuresPratique: Number(e.target.value)})} /></td>
                    <td><input type="number" className="form-control" placeholder="Maison" value={newData.heuresMaison} onChange={e => setNewData({...newData, heuresMaison: Number(e.target.value)})} /></td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function CoursPage() {
    return (
        <Suspense fallback={<div className="container mt-5">Chargement...</div>}>
            <CoursPageContent />
        </Suspense>
    )
}