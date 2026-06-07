'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Groupe, Charge as ChargeType, Cours, Enseignant } from "@/app/db/db"
import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import Charge from "./Charge"
import InputModal from "./InputModal"
import TransferModal from "./TransferModal"
import ContextMenuAddCourse from "./ContextMenuAddCourse"
import ContextMenuGroup from "./ContextMenuGroup"
import { toast } from "react-hot-toast"
import { useData } from "./DataContext"

export default function ListeCharges({enseignant, session, enseignantWidth, scenario = "production", style, isPrinting}: {enseignant: Enseignant, session: string, enseignantWidth: number, scenario?: string, style?: any, isPrinting?: boolean}){
    const { visibilityMap, setVisibility } = useData()
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null)

    const groupesData = useFirestoreCollection<Groupe>("groupes")
    const allChargesData = useFirestoreCollection<ChargeType>("charges")
    const coursData = useFirestoreCollection<Cours>("cours")

    useEffect(() => { setMounted(true) }, [])

    // 1. Filtrage et Préparation des données
    const scenarioCharges = useMemo(() => allChargesData?.filter(c => (c.scenario || "production") === scenario) || [], [allChargesData, scenario])
    const sessionGroupes = useMemo(() => groupesData?.filter(g => g.session === session) || [], [groupesData, session])

    // 2. Logique pour le menu d'ajout
    const [addMenu, setAddMenu] = useState<{show: boolean, pos: {left: number, top: number}}>({show: false, pos: {left: 0, top: 0}})

    const availableGroupsForMenu = useMemo(() => {
        return sessionGroupes.filter(groupe => {
            const groupCharges = scenarioCharges.filter(c => c.groupe === groupe.id)
            const totalT = groupCharges.filter(c => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
            const totalP = groupCharges.filter(c => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
            const canStillAddT = (groupe.aTheorie ?? true) && (15 - totalT > 0.001)
            const canStillAddP = (groupe.aPratique ?? true) && (15 - totalP > 0.001)
            const teacherHasT = groupCharges.some(c => c.enseignant === enseignant.id && (c.type === "T" || c.type === "TP"))
            const teacherHasP = groupCharges.some(c => c.enseignant === enseignant.id && (c.type === "P" || c.type === "TP"))
            return (canStillAddT && !teacherHasT) || (canStillAddP && !teacherHasP)
        })
    }, [sessionGroupes, scenarioCharges, enseignant.id])

    const groupsByCourseForMenu = useMemo(() => {
        const map: Record<string, Groupe[]> = {}
        availableGroupsForMenu.forEach(g => { if (!map[g.cours]) map[g.cours] = []; map[g.cours].push(g) })
        return map
    }, [availableGroupsForMenu])

    const sortedCourseIdsForMenu = useMemo(() => 
        Object.keys(groupsByCourseForMenu).sort((a, b) => (coursData?.find(c => c.id == a)?.sigle || "").localeCompare(coursData?.find(c => c.id == b)?.sigle || ""))
    , [groupsByCourseForMenu, coursData])

    // 3. Logique pour l'affichage (charges assignées)
    const teacherChargesInSession = useMemo(() => scenarioCharges.filter(c => c.enseignant === enseignant.id && sessionGroupes.some(g => g.id === c.groupe)), [scenarioCharges, enseignant.id, sessionGroupes])
    const chargesByCourseForDisplay = useMemo(() => {
        const map: Record<string, ChargeType[]> = {}
        teacherChargesInSession.forEach(c => { const g = sessionGroupes.find(gr => gr.id === c.groupe); if (g) { if (!map[g.cours]) map[g.cours] = []; map[g.cours].push(c) } })
        return map
    }, [teacherChargesInSession, sessionGroupes])

    const sortedCourseIdsForDisplay = useMemo(() => 
        Object.keys(chargesByCourseForDisplay).sort((a, b) => (coursData?.find(c => c.id == a)?.sigle || "").localeCompare(coursData?.find(c => c.id == b)?.sigle || ""))
    , [chargesByCourseForDisplay, coursData])

    // 4. Gestion de la visibilité globale
    const isExpanded = (courseId: string) => {
        const key = `${session}_${enseignant.id}_${courseId}_expanded`
        if (visibilityMap[key] !== undefined) return visibilityMap[key]
        if (visibilityMap["global_expansion"] !== undefined) return visibilityMap["global_expansion"]
        return false
    }

    // 5. Handlers
    async function quickAddCharge(groupe: Groupe, type: "T" | "P" | "TP" = "TP"){
        const groupCharges = scenarioCharges.filter(c => c.groupe === groupe.id)
        const existingCharge = groupCharges.find(c => c.enseignant === enseignant.id)
        const totalT = groupCharges.filter(c => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
        const totalP = groupCharges.filter(c => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
        const remT = Math.max(0, Number((15 - totalT).toFixed(3))), remP = Math.max(0, Number((15 - totalP).toFixed(3)))

        if (existingCharge) {
            if ((existingCharge.type === "T" && type === "P") || (existingCharge.type === "P" && type === "T") || type === "TP") {
                await firebaseDb.charges.update(existingCharge.id, { type: "TP", nbSemaines: 15 })
            } else {
                await firebaseDb.charges.update(existingCharge.id, { type, nbSemaines: type === "T" ? remT : remP })
            }
        } else {
            await firebaseDb.charges.add({groupe: groupe.id, enseignant: enseignant.id, nbSemaines: type === "TP" ? 15 : (type === "T" ? remT : remP), scenario, type, session})
        }
    }

    async function removeAllCourseCharges(courseId: string){
        const courseCharges = teacherChargesInSession.filter(c => sessionGroupes.find(gr => gr.id === c.groupe)?.cours === courseId)
        for (const charge of courseCharges) await firebaseDb.charges.delete(charge.id)
        toast.success("Charges supprimées"); setGroupMenu(prev => ({...prev, show: false}))
    }

    const [groupMenu, setGroupMenu] = useState<{show: boolean, pos: {left: number, top: number}, courseId: string | null}>({show: false, pos: {left: 0, top: 0}, courseId: null})
    const [groupTransferOpen, setGroupTransferOpen] = useState(false)
    const [transferCourseId, setGroupTransferCourseId] = useState<string | null>(null)

    async function handleGroupTransferConfirm(targetEnseignantId: string){
        if (!transferCourseId) return
        const courseCharges = teacherChargesInSession.filter(c => sessionGroupes.find(gr => gr.id === c.groupe)?.cours === transferCourseId)
        let count = 0
        for (const charge of courseCharges) {
            const exists = scenarioCharges.find(c => c.enseignant == targetEnseignantId && c.groupe == charge.groupe)
            if (exists) {
                if ((exists.type === "T" && charge.type === "P") || (exists.type === "P" && charge.type === "T")) {
                    await firebaseDb.charges.update(exists.id, { type: "TP" }); await firebaseDb.charges.delete(charge.id); count++
                }
            } else {
                await firebaseDb.charges.update(charge.id, { enseignant: targetEnseignantId }); count++
            }
        }
        toast.success(`${count} charge(s) transférée(s)`); setGroupTransferOpen(false)
    }

    async function dropHandlerCharge(ev: any) {
        ev.currentTarget.style.boxShadow = ""; ev.currentTarget.style.backgroundColor = ""
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId
        if (!idNouveauEnseignant) return
        const idCourse = ev.dataTransfer.getData("courseId"), idAncienEnseignant = ev.dataTransfer.getData("enseignantId")
        if (idCourse) {
            const courseCharges = scenarioCharges.filter(c => sessionGroupes.find(gr => gr.id === c.groupe)?.cours === idCourse && c.enseignant == idAncienEnseignant)
            for (const charge of courseCharges) {
                const target = scenarioCharges.find(c => c.enseignant == idNouveauEnseignant && c.groupe == charge.groupe)
                if (target && ((target.type === "T" && charge.type === "P") || (target.type === "P" && charge.type === "T"))) {
                    await firebaseDb.charges.update(target.id, { type: "TP" }); await firebaseDb.charges.delete(charge.id)
                } else if (!target) { await firebaseDb.charges.update(charge.id, { enseignant: idNouveauEnseignant }) }
            }
            return
        }
        const idGroupe = ev.dataTransfer.getData("groupeId")
        const oldC = scenarioCharges.find(c => c.enseignant == idAncienEnseignant && c.groupe == idGroupe), newC = scenarioCharges.find(c => c.enseignant == idNouveauEnseignant && c.groupe == idGroupe)
        if (newC && oldC && ((newC.type === "T" && oldC.type === "P") || (newC.type === "P" && oldC.type === "T"))) {
            await firebaseDb.charges.update(newC.id, { type: "TP" }); await firebaseDb.charges.delete(oldC.id); toast.success("Fusionnées")
        } else if (oldC && !newC) { await firebaseDb.charges.update(oldC.id, { enseignant: idNouveauEnseignant }); toast.success("Déplacée") }
    }

    const getCellStyle = () => ({ ...style, borderRight: "1px solid #dee2e6", borderBottom: "1px solid #dee2e6", minWidth: `${enseignantWidth}px`, width: `${enseignantWidth}px`, maxWidth: `${enseignantWidth}px`, overflow: "hidden" })

    return <td onContextMenu={e => { e.preventDefault(); setAddMenu({show: true, pos: {left: e.clientX, top: e.clientY}}) }} style={getCellStyle()} data-dropzone="charge" data-enseignant-id={enseignant.id} onDrop={dropHandlerCharge} onDragOver={e => e.preventDefault()} onDragEnter={e => { e.preventDefault(); e.currentTarget.style.boxShadow = "inset 0 0 0 2px #0d6efd"; e.currentTarget.style.backgroundColor = "rgba(13, 110, 253, 0.05)"; }} onDragLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.backgroundColor = ""; }}>
        {sortedCourseIdsForDisplay.map(courseId => {
            const courseCharges = chargesByCourseForDisplay[courseId], cour = coursData?.find(c => c.id == courseId), expanded = isExpanded(courseId)
            return <div key={courseId} className="mb-2 rounded shadow-sm overflow-hidden" style={{ border: "1px solid #ddd", borderLeft: `6px solid ${cour?.couleur || "#0dcaf0"}`, backgroundColor: "white", display: "block", cursor: expanded && isPrinting ? "default" : "grab" }} draggable={!isPrinting} onDragStart={ev => { ev.dataTransfer.setData("courseId", courseId); ev.dataTransfer.setData("enseignantId", enseignant.id); }} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setGroupMenu({show: true, pos: {left: e.clientX, top: e.clientY}, courseId}) }}>
                <div className="d-flex justify-content-between align-items-center cursor-pointer p-2" onClick={() => setVisibility(`${session}_${enseignant.id}_${courseId}_expanded`, !expanded)} style={{ fontSize: "0.8rem" }}>
                    <div className="flex-grow-1 min-width-0">
                        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                            <span className="fw-bold text-dark text-truncate">{cour?.sigle}</span>
                            <div className="d-flex gap-1 flex-shrink-0">
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.65rem" }} title="Groupes"><span style={{marginRight: "3px"}}>👥</span>{courseCharges.length}</span>
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.65rem" }} title="Étudiants"><span style={{marginRight: "3px"}}>👤</span>{courseCharges.reduce((sum, c) => sum + (sessionGroupes.find(gr => gr.id === c.groupe)?.nbEtudiants ?? 0), 0)}</span>
                            </div>
                        </div>
                        <div className="text-muted text-truncate d-none d-xl-block" style={{ fontSize: "0.7rem" }}>{cour?.nom}</div>
                    </div>
                    <div className="d-flex align-items-center ps-2 flex-shrink-0 no-print"><span style={{ fontSize: "0.65rem", color: "#666" }}>{expanded ? "▲" : "▼"}</span></div>
                </div>
                {expanded && <div className="p-2 pt-0"><div className="ps-2 border-start" style={{ borderColor: "#eee" }}>{courseCharges.map(charge => { const groupe = sessionGroupes.find(g => g.id == charge.groupe); return (groupe && cour) ? <Charge key={charge.id} session={session} charge={charge} groupe={groupe} cours={cour} charges={scenarioCharges} enseignantId={enseignant.id} onRemove={(gid: string, eid: string) => { const c = scenarioCharges.find(ch => ch.groupe == gid && ch.enseignant == eid); if(c) firebaseDb.charges.delete(c.id) }} scenario={scenario} minimal={true}/> : null })}</div></div>}
            </div>
        })}
        {mounted && addMenu.show && createPortal(<ContextMenuAddCourse position={addMenu.pos} onClose={() => setAddMenu({show: false, pos: {left:0, top:0}})} onAdd={quickAddCharge} onAddAll={list => list.forEach(g => quickAddCharge(g, "TP"))} onOpenModal={g => {setSelectedGroupe(g); setModalOpen(true); setAddMenu({show: false, pos:{left:0, top:0}})}} sortedCourseIds={sortedCourseIdsForMenu} groupsByCourse={groupsByCourseForMenu} coursData={coursData} scenarioCharges={scenarioCharges} enseignantId={enseignant.id} />, document.body)}
        {mounted && groupMenu.show && createPortal(<ContextMenuGroup position={groupMenu.pos} onClose={() => setGroupMenu(prev => ({...prev, show: false}))} onRemoveAll={() => removeAllCourseCharges(groupMenu.courseId!)} onTransferAll={() => { setGroupTransferCourseId(groupMenu.courseId); setGroupTransferOpen(true); setGroupMenu(prev => ({...prev, show: false})) }} onEditCourse={() => window.open("/admin/cours?highlight=" + groupMenu.courseId, "_blank")} />, document.body)}
        <InputModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={val => { if(selectedGroupe) firebaseDb.charges.add({groupe: selectedGroupe.id, enseignant: enseignant.id, nbSemaines: val, scenario, type: "TP", session}).then(() => setModalOpen(false)) }} title="Ajouter une charge" label={`Semaines pour ${selectedGroupe ? coursData?.find(c => c.id === selectedGroupe.cours)?.sigle : ''} :`} defaultValue={15} max={15} />
        {transferCourseId && <TransferModal isOpen={groupTransferOpen} onClose={() => setGroupTransferOpen(false)} onConfirm={handleGroupTransferConfirm} title={`Transférer ${coursData?.find(c => c.id === transferCourseId)?.sigle}`} currentEnseignantId={enseignant.id} />}
    </td>
}
