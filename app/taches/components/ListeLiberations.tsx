'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import Liberation from "./Liberation"
import type { Allocation, Liberation as LiberationType, Enseignant } from "@/app/db/db"
import InputModal from "./InputModal"
import { toast } from "react-hot-toast"
import { useContextMenu } from "@/app/utilities/hooks"

export default function ListeLiberations({enseignant, session, enseignantWidth, scenario = "production", style}: {enseignant: Enseignant, session: string, enseignantWidth: number, scenario?: string, style?: any}){
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)

    const { isVisible, position, menuRef, openMenu, closeMenu } = useContextMenu()

    const allocations = useFirestoreCollection<Allocation>("allocations")
    const allLiberations = useFirestoreCollection<LiberationType>("liberations")

    // Filter by scenario
    const liberations = useMemo(() => allLiberations?.filter(l => (l.scenario || "production") === scenario), [allLiberations, scenario])

    const [menuSearch, setMenuSearch] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    async function removeHandlerLiberation(liberationId: string, enseignantId: string){
        await firebaseDb.liberations.delete(liberationId)
    }

    async function addHandlerLiberation(quantite: number){
        if(selectedAllocation){
            await firebaseDb.liberations.add({allocation: selectedAllocation.id, enseignant: enseignant.id, quantite, scenario, session})
            setModalOpen(false)
            closeMenu()
            setMenuSearch("");
        }
    }

    async function quickAddLiberation(allocation: Allocation, quantite: number){
        await firebaseDb.liberations.add({allocation: allocation.id, enseignant: enseignant.id, quantite, scenario, session})
        closeMenu()
        setMenuSearch("");
    }

    function dragOverHandlerLiberation(ev: any) {
        ev.preventDefault()
    }

    async function dropHandlerLiberation(ev: any) {
        ev.currentTarget.style.boxShadow = ""
        ev.currentTarget.style.backgroundColor = ""
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId

        if (!idNouveauEnseignant) return

        const idLiberation = ev.dataTransfer.getData("liberationId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        const ancienneLiberation = liberations?.find(liberation => liberation.enseignant == idAncienEnseignant && liberation.id == idLiberation)
        const liberationExiste = liberations?.find(liberation => liberation.enseignant == idNouveauEnseignant && liberation.allocation == ancienneLiberation?.allocation)

        if (liberationExiste) {
            toast.error("Cet enseignant a déjà cette libération")
            return
        }

        const nouvelleLiberation = {
            enseignant: idNouveauEnseignant,
            allocation: ancienneLiberation?.allocation ?? "",
            quantite: ancienneLiberation?.quantite ?? 0,
            scenario,
            session
        }

        await firebaseDb.liberations.add(nouvelleLiberation)
        if (ancienneLiberation) {
            await firebaseDb.liberations.delete(ancienneLiberation.id)
        }
        toast.success("Libération déplacée")
    }

    function dragEnter(ev: any) {
        ev.preventDefault()
        if (ev.currentTarget.dataset.dropzone == "liberation" && ev.dataTransfer.types.includes("liberationid")) {
            ev.currentTarget.style.boxShadow = "inset 0 0 0 2px #6f42c1"
            ev.currentTarget.style.backgroundColor = "rgba(111, 66, 193, 0.05)"
        }
    }

    function dragLeave(ev: any) {
        if (!ev.currentTarget.contains(ev.relatedTarget)) {
            ev.currentTarget.style.boxShadow = ""
            ev.currentTarget.style.backgroundColor = ""
        }
    }

    const currentAllocationLiberations = liberations?.filter(liberation => liberation.allocation == selectedAllocation?.id)
    const currentAllocationSomme = currentAllocationLiberations?.reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0)
    const currentAllocationMax = Number(((selectedAllocation?.quantite ?? 0) - (currentAllocationSomme ?? 0)).toFixed(3))

    const menuContent = isVisible && (
        <div 
            ref={menuRef}
            style={{
                position: "fixed", 
                left: position.left, 
                top: position.top, 
                backgroundColor: "#212529", 
                color: "white",
                display: "block", 
                padding: "10px", 
                zIndex: 9999,
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                minWidth: "200px",
                border: "1px solid #444",
                maxHeight: "80vh",
                overflowY: "auto",
                opacity: (position.left === 0 && position.top === 0) ? 0 : 1
            }}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Ajouter une libération</p>
            <div className="mb-2">
                <input 
                    type="text" 
                    className="form-control form-control-sm bg-dark text-white border-secondary" 
                    placeholder="Rechercher..." 
                    value={menuSearch} 
                    onChange={e => setMenuSearch(e.target.value)}
                    autoFocus
                />
            </div>
            {allocations?.filter(allocation => {
                if(allocation.session != session) return false
                const liberation = liberations?.find(liberation => liberation.allocation == allocation.id && liberation.enseignant == enseignant.id)
                if(liberation) return false
                const totalLiberations = liberations?.filter(liberation => liberation.allocation == allocation.id).reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0) ?? 0
                const remaining = (allocation.quantite ?? 0) - totalLiberations
                if(remaining < 0.001) return false
                
                if (menuSearch) {
                    const searchLower = menuSearch.toLowerCase()
                    return (allocation.code?.toLowerCase().includes(searchLower) || allocation.description?.toLowerCase().includes(searchLower))
                }
                
                return true
            }).sort((a, b) => (a.code || "").localeCompare(b.code || ""))
            .map(allocation => {
                const totalLiberations = liberations?.filter(l => l.allocation == allocation.id).reduce((somme, l) => somme + (l.quantite ?? 0), 0) ?? 0
                const remaining = Number(((allocation.quantite ?? 0) - totalLiberations).toFixed(3))
                const isPartial = totalLiberations > 0.001

                return <div key={allocation.id} className="d-flex gap-1 mb-1 align-items-stretch">
                    <button 
                        className="btn btn-outline-light btn-sm flex-grow-1 text-start py-1 px-2 d-flex justify-content-between align-items-center" 
                        style={{fontSize: '0.75rem'}}
                        onClick={() => quickAddLiberation(allocation, remaining)}
                        title={`Assigner le reste (${remaining.toFixed(3)} ETC)`}
                    >
                        <div style={{lineHeight: "1.2"}}>
                            <span className="fw-bold text-info">{allocation.code}</span><br/>
                            <span className="text-white-50 extra-small fw-normal">{allocation.description}</span>
                        </div>
                        {isPartial && <span className="badge bg-warning text-dark ms-2" style={{fontSize: '0.6rem'}}>{Number(remaining.toFixed(3))}</span>}
                    </button>
                    <button 
                        className="btn btn-outline-secondary btn-sm px-2 py-1" 
                        title="Assignation personnalisée (ETC)"
                        style={{fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)'}}
                        onClick={() => {setSelectedAllocation(allocation); setModalOpen(true); closeMenu();}}
                    >
                        ⚙️
                    </button>
                </div>
            })}
        </div>
    )

    const liberationsEnseignant = useMemo(() => liberations?.filter(liberation => liberation.enseignant == enseignant.id), [liberations, enseignant.id])
    const allocationsSession = useMemo(() => allocations?.filter(allocation => allocation.session == session), [allocations, session])
    const liberationsSession = useMemo(() => liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation)), [liberationsEnseignant, allocationsSession])

    return <td 
        key={enseignant.id} 
        onContextMenu={openMenu} 
        style={{...style, position: "relative", transition: "background-color 0.2s"}}
        data-dropzone="liberation"
        data-enseignant-id={enseignant.id}
        onDrop={dropHandlerLiberation}
        onDragOver={dragOverHandlerLiberation}
        onDragEnter={dragEnter}
        onDragLeave={dragLeave}
    >
        {liberationsSession?.map(liberation => {
            const allocation = allocations?.find(allocation => allocation.id == liberation.allocation)
            if(!allocation) return null
            return <Liberation key={liberation.id} session={session} liberation={liberation} allocation={allocation} liberations={liberations} enseignantId={enseignant.id} onRemove={removeHandlerLiberation} scenario={scenario}/>
        })}
        
        {mounted && createPortal(menuContent, document.body)}

        <InputModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={addHandlerLiberation}
            title="Ajouter une libération"
            label={`Quantité de libération pour ${selectedAllocation?.code} (en ETC) :`}
            defaultValue={currentAllocationMax}
            max={currentAllocationMax}
            step={0.001}
        />
    </td>
}
