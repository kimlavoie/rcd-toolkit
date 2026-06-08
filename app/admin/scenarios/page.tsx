'use client'

import { useGenericAdmin } from "@/app/admin/components/useGenericAdmin"
import { useRouter } from "next/navigation"
import { useEffect, Suspense, useMemo } from "react"
import { useAuth } from "@/app/utilities/auth"
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import type { Scenario } from "@/app/db/db"
import { toast } from "react-hot-toast"
import SelectSession from "../components/inputs/SelectSession"
import { collection, query, where, getDocs } from "firebase/firestore"
import { firestore } from "@/app/utilities/firebase"
import Skeleton from "@/app/utilities/Skeleton";


function ScenariosPageContent() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const allScenarios = useFirestoreCollection<Scenario>("scenarios")
    
    const {
        search, setSearch, sortedData, toggleSort, getSortIcon,
        editingId, editData, setEditData, newData, setNewData,
        startEdit, cancelEdit, saveEdit, addNew, deleteItem
    } = useGenericAdmin<Scenario>({
        collectionName: "scenarios",
        initialSortKey: "session",
        filterFn: (s, search) => {
            const searchLower = search.toLowerCase()
            return (s.nom ?? "").toLowerCase().includes(searchLower) || 
                   (s.session ?? "").toLowerCase().includes(searchLower)
        },
        defaultNewData: { nom: "", session: "A26", notes: "", isDefault: false },
        onBeforeAdd: (data) => {
            if (!data.nom || !data.session) {
                toast.error("Le nom et la session sont requis.")
                return false
            }
        }
    })

    const [isCopying, setIsCopying] = useMemo(() => [false, () => {}], []) // Placeholder state for simplicity or I can keep it

    if (loading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )
    if (!user) {
        router.push("/login")
        return null
    }

    async function toggleDefault(scenario: Scenario) {
        const others = allScenarios?.filter(s => s.session === scenario.session && s.id !== scenario.id && s.isDefault)
        if (others) {
            for (const other of others) {
                await firebaseDb.scenarios.update(other.id, { isDefault: false })
            }
        }
        await firebaseDb.scenarios.update(scenario.id, { isDefault: !scenario.isDefault })
    }

    // copyScenario and copyProduction logic remains the same (they use Firestore directly)
    // ... I'll keep them but I'll skip re-writing them entirely if possible to save tokens, 
    // but I must provide the FULL file.

    async function copyScenario(scenario: Scenario) {
        try {
            toast.loading(`Copie du scénario "${scenario.nom}" en cours...`, { id: "copy-scenario" })
            const newScenarioData = {
                nom: `Copie de ${scenario.nom}`,
                session: scenario.session,
                notes: (scenario.notes ? scenario.notes + "\n" : "") + `[Copié de : ${scenario.nom} le ${new Date().toLocaleDateString()}]`,
                isDefault: false
            }
            const newScenarioRef = await firebaseDb.scenarios.add(newScenarioData)
            const newScenarioId = newScenarioRef.id

            const copyCollection = async (collectionName: string) => {
                const q = query(collection(firestore, collectionName), where("scenario", "==", scenario.id), where("userId", "==", user!.uid))
                const snapshot = await getDocs(q)
                const promises = snapshot.docs.map(docSnap => {
                    const { userId, ...data } = docSnap.data()
                    return (firebaseDb[collectionName as keyof typeof firebaseDb] as any).add({ ...data, scenario: newScenarioId, session: scenario.session })
                })
                await Promise.all(promises)
            }

            await Promise.all([copyCollection("charges"), copyCollection("liberations"), copyCollection("supervisions")])
            toast.success("Scénario copié avec succès", { id: "copy-scenario" })
        } catch (error) {
            console.error("Error copying scenario:", error)
            toast.error("Erreur lors de la copie du scénario", { id: "copy-scenario" })
        }
    }

    async function copyProduction(session: string) {
        try {
            const nom = newData.nom || `Copie Production ${session}`
            toast.loading(`Copie de la production (${session}) en cours...`, { id: "copy-prod" })
            const newScenarioData = {
                nom: nom,
                session: session,
                notes: (newData.notes ? newData.notes + "\n" : "") + `[Copié de la production le ${new Date().toLocaleDateString()}]`,
                isDefault: newData.isDefault ?? false
            }
            const newScenarioRef = await firebaseDb.scenarios.add(newScenarioData)
            const newScenarioId = newScenarioRef.id

            const [groupesSnap, allocationsSnap, stagesSnap] = await Promise.all([
                getDocs(query(collection(firestore, "groupes"), where("session", "==", session), where("userId", "==", user!.uid))),
                getDocs(query(collection(firestore, "allocations"), where("session", "==", session), where("userId", "==", user!.uid))),
                getDocs(query(collection(firestore, "stages"), where("session", "==", session), where("userId", "==", user!.uid)))
            ])

            const groupeIds = new Set(groupesSnap.docs.map(d => d.id))
            const allocationIds = new Set(allocationsSnap.docs.map(d => d.id))
            const stageIds = new Set(stagesSnap.docs.map(d => d.id))

            const copyFiltered = async (collectionName: string, idField: string, validIds: Set<string>) => {
                const q = query(collection(firestore, collectionName), where("scenario", "==", "production"), where("userId", "==", user!.uid))
                const snapshot = await getDocs(q)
                const promises = snapshot.docs.filter(docSnap => validIds.has(docSnap.data()[idField])).map(docSnap => {
                    const { userId, ...data } = docSnap.data()
                    return (firebaseDb[collectionName as keyof typeof firebaseDb] as any).add({ ...data, scenario: newScenarioId, session: session })
                })
                await Promise.all(promises)
            }

            await Promise.all([copyFiltered("charges", "groupe", groupeIds), copyFiltered("liberations", "allocation", allocationIds), copyFiltered("supervisions", "stage", stageIds)])
            toast.success("Production copiée avec succès", { id: "copy-prod" })
            setNewData({ nom: "", session: session, notes: "", isDefault: false })
        } catch (error) {
            console.error("Error copying production:", error)
            toast.error("Erreur lors de la copie de la production", { id: "copy-prod" })
        }
    }

    return <div className="container mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-primary mb-0">Gestion des Scénarios</h2>
            <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input type="text" className="form-control border-start-0 ps-0" placeholder="Rechercher par nom ou session..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}>✕</button>}
            </div>
        </div>
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
                                    <td className="text-center"><input type="checkbox" checked={editData.isDefault} onChange={e => setEditData({...editData, isDefault: e.target.checked})} /></td>
                                    <td>
                                        <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                        <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>❌</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{scenario.session}</td>
                                    <td>{scenario.nom}</td>
                                    <td>{scenario.notes}</td>
                                    <td className="text-center">
                                        <button className={`btn btn-sm ${scenario.isDefault ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={() => toggleDefault(scenario)} title="Définir comme scénario par défaut pour cette session">{scenario.isDefault ? '⭐' : '☆'}</button>
                                    </td>
                                    <td>
                                        <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(scenario)} title="Modifier">✏️</button>
                                        <button type="button" className="btn btn-outline-info btn-sm me-1" onClick={() => copyScenario(scenario)} title="Copier le scénario">📋</button>
                                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => deleteItem(scenario.id)} title="Supprimer">🗑️</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    <tr className="table-info">
                        <td><SelectSession code={newData.session} onChange={(val: any) => setNewData({...newData, session: val})} /></td>
                        <td><input className="form-control" placeholder="Nom..." value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                        <td><input className="form-control" placeholder="Notes..." value={newData.notes} onChange={e => setNewData({...newData, notes: e.target.value})} /></td>
                        <td className="text-center"><input type="checkbox" checked={newData.isDefault} onChange={e => setNewData({...newData, isDefault: e.target.checked})} /></td>
                        <td>
                            <div className="d-flex gap-1">
                                <button className="btn btn-primary btn-sm flex-grow-1" onClick={addNew} title="Créer un nouveau scénario vide">+</button>
                                <button className="btn btn-info btn-sm text-white" onClick={() => copyProduction(newData.session || "A26")} title="Créer à partir de la production">📋 Prod</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
}

export default function ScenariosPage() {
    return <Suspense fallback={(
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )}><ScenariosPageContent /></Suspense>
}
