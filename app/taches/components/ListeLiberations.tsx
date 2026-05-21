'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Liberation from "./Liberation"
import type { Allocation, Liberation as LiberationType, Enseignant } from "@/app/db/db"
import InputModal from "./InputModal"
import { toast } from "react-hot-toast"

export default function ListeLiberations({enseignant, session, enseignantWidth, scenario = "production", style}: {enseignant: Enseignant, session: string, enseignantWidth: number, scenario?: string, style?: any}){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)

    const allocations = useFirestoreCollection<Allocation>("allocations")
    const allLiberations = useFirestoreCollection<LiberationType>("liberations")

    // Filter by scenario
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario)

    useEffect(() => {
        setMounted(true)
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setHideMenu(true);
            }
        };

        if (!hideMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [hideMenu]);

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    async function removeHandlerLiberation(liberationId: string, enseignantId: string){
        await firebaseDb.liberations.delete(liberationId)
    }

    async function addHandlerLiberation(quantite: number){
        if(selectedAllocation){
            await firebaseDb.liberations.add({allocation: selectedAllocation.id, enseignant: enseignant.id, quantite, scenario})
            setModalOpen(false)
            setHideMenu(true)
        }
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
            scenario
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

    const menuContent = !hideMenu && (
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
                border: "1px solid #444"
            }}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Ajouter une libération</p>
            {allocations?.filter(allocation => {
                if(allocation.session != session) return false
                const liberation = liberations?.find(liberation => liberation.allocation == allocation.id && liberation.enseignant == enseignant.id)
                if(liberation) return false
                const totalLiberations = liberations?.filter(liberation => liberation.allocation == allocation.id).reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0)
                if((allocation.quantite ?? 0) - (totalLiberations ?? 0) < 0.001) return false
                return true
            }).map(allocation => (
                <p key={allocation.id} className="mb-1">
                    <button className="btn btn-outline-light btn-sm w-100 text-start" onClick={() => {setSelectedAllocation(allocation); setModalOpen(true)}}>
                        {allocation.code}
                    </button>
                </p>
            ))}
        </div>
    )

    const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
    const allocationsSession = allocations?.filter(allocation => allocation.session == session)
    const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))

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
        
        {mounted && menuContent && createPortal(menuContent, document.body)}

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
