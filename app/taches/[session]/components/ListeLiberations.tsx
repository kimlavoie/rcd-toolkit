import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Liberation from "./Liberation"
import type { Liberation as LiberationType, Allocation } from "@/app/db/db"

export default function({enseignant, session}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    const liberations = useFirestoreCollection<LiberationType>("liberations")
    const allocations = useFirestoreCollection<Allocation>("allocations")

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

    function openMenu(ev: any) {
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    async function newSelectionLiberation(ev: any){
        const enseignantID = ev.target.dataset.enseignantId
        const allocationID = ev.target.dataset.allocationId

        const liberationsAllocation = liberations?.filter(liberation => liberation.allocation == allocationID)
        const sommeLiberations = liberationsAllocation?.reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0)

        const allocation = allocations?.find(allocation => allocation.id == allocationID)
        const qteAllocation = allocation?.quantite

        const qteRestante = String(((qteAllocation ?? 0) - (sommeLiberations ?? 0)).toFixed(2))

        const quantite = Number(prompt("Entrez la quantité de libération en ETC (max: " + qteRestante + ")", qteRestante))

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }

        if((sommeLiberations ?? 0) + quantite > (qteAllocation ?? 0)){
            alert("La quantité de libération est trop grande pour l'allocation. Veuillez choisir une autre quantité")
            return
        }
        
        const liberation = {
            enseignant: enseignantID,
            allocation: allocationID,
            quantite: quantite
        }
        
        await firebaseDb.liberations.add(liberation)
        setHideMenu(true)
    }

    function dragOverHandlerLiberation(ev:any){
        ev.preventDefault()
    }

    async function dropHandlerLiberation(ev:any){
        ev.currentTarget.style.boxShadow = "inset 0 0 0 0"
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId

        if(!idNouveauEnseignant){
            return
        }

        const idLiberation = ev.dataTransfer.getData("liberationId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        const ancienneLiberation = liberations?.find(liberation => liberation.enseignant == idAncienEnseignant && liberation.id == idLiberation)

        const liberationExiste = liberations?.find(liberation => liberation.enseignant == idNouveauEnseignant && liberation.allocation == ancienneLiberation?.allocation)
        
        if(liberationExiste){
            alert("Cet enseignant a deja cette liberation")
            return
        }

        const nouvelleLiberation = {
            enseignant: idNouveauEnseignant,
            allocation: ancienneLiberation?.allocation ?? "",
            quantite: ancienneLiberation?.quantite ?? 0
        }

        await firebaseDb.liberations.add(nouvelleLiberation)
        if (ancienneLiberation) {
            await firebaseDb.liberations.delete(ancienneLiberation.id)
        }
    }

    async function removeHandlerLiberation(liberationId:any, enseignantId:any){
        await firebaseDb.liberations.delete(liberationId)        
    }

    function dragEnter(ev:any){
        if(ev.currentTarget.dataset.dropzone == "liberation" && ev.dataTransfer.types.includes("liberationid")){
            ev.currentTarget.style.boxShadow = "inset 0 0 0 2px red"
        }
    }
    
    function dragLeave(ev:any){
        if(!ev.currentTarget.contains(ev.relatedTarget)){
            ev.currentTarget.style.boxShadow = "inset 0 0 0 0"
        }
    }

    const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
    const allocationsSession = allocations?.filter((allocation: any) => allocation.session == session)
                
    const menuContent = !hideMenu && (
        <div 
            ref={menuRef}
            style={{
                position: "fixed", 
                left: position.left, 
                top: position.top, 
                backgroundColor: "#444", 
                color: "white",
                display: "block", 
                padding: "10px", 
                zIndex: 9999,
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                minWidth: "200px",
                maxHeight: "300px",
                overflowY: "auto"
            }}
        >
            <h6 className="border-bottom pb-1 mb-2 text-info">Ajouter une libération</h6>
            {allocationsSession?.filter((allocation:any) => {
                const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
                const sommeLiberations = liberation?.reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0)
                const liberationExiste = liberations?.find(liberation => liberation.enseignant == enseignant.id && liberation.allocation == allocation.id)

                return ((allocation.quantite ?? 0) - (sommeLiberations ?? 0)) > 0.001  && !liberationExiste
            })
            ?.toSorted((a:any, b:any) => (a.description ?? "").localeCompare(b.description ?? ""))
            ?.map((allocation: any, index:number) => {
                return <p key={index} className="mb-1">
                    <button className="btn btn-sm btn-outline-light w-100 text-start" data-allocation-id={allocation.id} data-enseignant-id={enseignant.id} onClick={newSelectionLiberation}>
                        {allocation.code} - {allocation.description} ({allocation.quantite})
                    </button>
                </p>
            })}
            {allocationsSession?.length === 0 && <p className="small text-muted mb-0">Aucune allocation disponible</p>}
        </div>
    )

    return <td onContextMenu={openMenu} key={enseignant.id} data-enseignant-id={enseignant.id} data-dropzone="liberation" onDrop={dropHandlerLiberation} onDragOver={dragOverHandlerLiberation} onDragEnter={dragEnter} onDragLeave={dragLeave} style={{paddingBottom: "50px", position: "relative"}}>
        {liberationsEnseignant?.filter(liberation => {
            const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
            return allocation?.session == session
        })?.map((liberation: any) => {
            const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
            return <Liberation key={liberation?.id} session={session} liberation={liberation} allocation={allocation} liberations={liberations} enseignantId={enseignant.id} onRemove={removeHandlerLiberation}/>
        })}
        
        {mounted && menuContent && createPortal(menuContent, document.body)}
    </td>
}