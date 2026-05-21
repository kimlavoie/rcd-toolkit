'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/app/utilities/auth"
import type { Scenario } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"
import SelectSession from "../components/inputs/SelectSession"
import { collection, query, where, getDocs } from "firebase/firestore"
import { firestore } from "@/app/utilities/firebase"

export default function ScenariosPage() {
    const { user, loading } = useAuth()
    const scenarios = useFirestoreCollection<Scenario>("scenarios")
    const router = useRouter()
    
    const { sortedData, toggleSort, getSortIcon } = useTableSort(scenarios, "session")

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ nom: "", session: "A26", notes: "", isDefault: false })
    const [isCopying, setIsCopying] = useState<string | null>(null)

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(scenario: any) {
        setEditingId(scenario.id)
        setEditData({ ...scenario })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.scenarios.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.nom && newData.session) {
            await firebaseDb.scenarios.add(newData)
            setNewData({ nom: "", session: "A26", notes: "", isDefault: false })
        } else {
            toast.error("Le nom et la session sont requis.")
        }
    }

    async function toggleDefault(scenario: Scenario) {
        // Unset other defaults for the same session
        const others = scenarios?.filter(s => s.session === scenario.session && s.id !== scenario.id && s.isDefault)
        if (others) {
            for (const other of others) {
                await firebaseDb.scenarios.update(other.id, { isDefault: false })
            }
        }
        await firebaseDb.scenarios.update(scenario.id, { isDefault: !scenario.isDefault })
    }

    async function copyScenario(scenario: Scenario) {
        try {
            setIsCopying(scenario.id)
            toast.loading(`Copie du scénario "${scenario.nom}" en cours...`, { id: "copy-scenario" })

            // 1. Create the new scenario document
            const newScenarioData = {
                nom: `Copie de ${scenario.nom}`,
                session: scenario.session,
                notes: (scenario.notes ? scenario.notes + "\n" : "") + `[Copié de : ${scenario.nom} le ${new Date().toLocaleDateString()}]`,
                isDefault: false
            }
            const newScenarioRef = await firebaseDb.scenarios.add(newScenarioData)
            const newScenarioId = newScenarioRef.id

            // 2. Helper to copy sub-collections
            const copyCollection = async (collectionName: string) => {
                const q = query(
                    collection(firestore, collectionName), 
                    where("scenario", "==", scenario.id),
                    where("userId", "==", user!.uid)
                )
                const snapshot = await getDocs(q)
                
                const promises = snapshot.docs.map(docSnap => {
                    const { userId, ...data } = docSnap.data()
                    return firebaseDb[collectionName as keyof typeof firebaseDb].add({
                        ...data,
                        scenario: newScenarioId
                    })
                })
                await Promise.all(promises)
            }

            // Copy all related data
            await copyCollection("charges")
            await copyCollection("liberations")
            await copyCollection("supervisions")

            toast.success("Scénario copié avec succès", { id: "copy-scenario" })
        } catch (error) {
            console.error("Error copying scenario:", error)
            toast.error("Erreur lors de la copie du scénario", { id: "copy-scenario" })
        } finally {
            setIsCopying(null)
        }
    }

    async function copyProduction(session: string) {
        try {
            const nom = newData.nom || `Copie Production ${session}`
            setIsCopying("production-" + session)
            toast.loading(`Copie de la production (${session}) en cours...`, { id: "copy-prod" })

            // 1. Create the new scenario document
            const newScenarioData = {
                nom: nom,
                session: session,
                notes: (newData.notes ? newData.notes + "\n" : "") + `[Copié de la production le ${new Date().toLocaleDateString()}]`,
                isDefault: newData.isDefault
            }
            const newScenarioRef = await firebaseDb.scenarios.add(newScenarioData)
            const newScenarioId = newScenarioRef.id

            // 2. Fetch dependencies to filter production data by session
            // We need to find which items belong to the requested session
            const [groupesSnap, allocationsSnap, stagesSnap] = await Promise.all([
                getDocs(query(collection(firestore, "groupes"), where("session", "==", session), where("userId", "==", user!.uid))),
                getDocs(query(collection(firestore, "allocations"), where("session", "==", session), where("userId", "==", user!.uid))),
                getDocs(query(collection(firestore, "stages"), where("session", "==", session), where("userId", "==", user!.uid)))
            ])

            const groupeIds = new Set(groupesSnap.docs.map(d => d.id))
            const allocationIds = new Set(allocationsSnap.docs.map(d => d.id))
            const stageIds = new Set(stagesSnap.docs.map(d => d.id))

            // 3. Helper to copy with filtering
            const copyFiltered = async (collectionName: string, idField: string, validIds: Set<string>) => {
                const q = query(
                    collection(firestore, collectionName), 
                    where("scenario", "==", "production"),
                    where("userId", "==", user!.uid)
                )
                const snapshot = await getDocs(q)
                
                const promises = snapshot.docs
                    .filter(docSnap => validIds.has(docSnap.data()[idField]))
                    .map(docSnap => {
                        const { userId, ...data } = docSnap.data()
                        return firebaseDb[collectionName as keyof typeof firebaseDb].add({
                            ...data,
                            scenario: newScenarioId
                        })
                    })
                await Promise.all(promises)
            }

            await Promise.all([
                copyFiltered("charges", "groupe", groupeIds),
                copyFiltered("liberations", "allocation", allocationIds),
                copyFiltered("supervisions", "stage", stageIds)
            ])

            toast.success("Production copiée avec succès", { id: "copy-prod" })
            setNewData({ nom: "", session: session, notes: "", isDefault: false })
        } catch (error) {
            console.error("Error copying production:", error)
            toast.error("Erreur lors de la copie de la production", { id: "copy-prod" })
        } finally {
            setIsCopying(null)
        }
    }

    return <div className="container mt-3">
        <h2 className="mb-4 text-primary">Gestion des Scénarios</h2>
        <div className="card shadow-sm p-4">
            <table className="table table-striped align-middle">
                <thead>
                    <tr>
                        <th onClick={() => toggleSort("session")} style={{cursor: "pointer"}}>Session {getSortIcon("session")}</th>
                        <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom du scénario {getSortIcon("nom")}</th>
                        <th>Notes</th>
                        <th style={{width: "100px"}}>Défaut</th>
                        <th style={{width: "180px"}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((scenario) => (
                        <tr key={scenario.id}>
                            {editingId === scenario.id ? (
                                <>
                                    <td><SelectSession code={editData.session} onChange={(val: any) => setEditData({...editData, session: val})} /></td>
                                    <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                    <td><input className="form-control" value={editData.notes || ""} onChange={e => setEditData({...editData, notes: e.target.value})} /></td>
                                    <td className="text-center">
                                        <input type="checkbox" checked={editData.isDefault} onChange={e => setEditData({...editData, isDefault: e.target.checked})} />
                                    </td>
                                    <td>
                                        <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{scenario.session}</td>
                                    <td>{scenario.nom}</td>
                                    <td>{scenario.notes}</td>
                                    <td className="text-center">
                                        <button 
                                            className={`btn btn-sm ${scenario.isDefault ? 'btn-warning' : 'btn-outline-secondary'}`}
                                            onClick={() => toggleDefault(scenario)}
                                            title="Définir comme scénario par défaut pour cette session"
                                        >
                                            {scenario.isDefault ? '⭐' : '☆'}
                                        </button>
                                    </td>
                                    <td>
                                        <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(scenario)} title="Modifier">✏️</button>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-info btn-sm me-1" 
                                            onClick={() => copyScenario(scenario)} 
                                            disabled={isCopying !== null}
                                            title="Copier le scénario"
                                        >
                                            📋
                                        </button>
                                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.scenarios.delete(scenario.id)} title="Supprimer">🗑️</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    <tr className="table-info">
                        <td><SelectSession code={newData.session} onChange={(val: any) => setNewData({...newData, session: val})} /></td>
                        <td><input className="form-control" placeholder="Nom..." value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                        <td><input className="form-control" placeholder="Notes..." value={newData.notes} onChange={e => setNewData({...newData, notes: e.target.value})} /></td>
                        <td className="text-center">
                            <input type="checkbox" checked={newData.isDefault} onChange={e => setNewData({...newData, isDefault: e.target.checked})} />
                        </td>
                        <td>
                            <div className="d-flex gap-1">
                                <button className="btn btn-primary btn-sm flex-grow-1" onClick={addNew} title="Créer un nouveau scénario vide">+</button>
                                <button 
                                    className="btn btn-info btn-sm text-white" 
                                    onClick={() => copyProduction(newData.session)}
                                    disabled={isCopying !== null}
                                    title="Créer à partir de la production"
                                >
                                    📋 Prod
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
}
