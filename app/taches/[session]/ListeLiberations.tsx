import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import Liberation from "./Liberation"

export default function({enseignant, session}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: "0px", top: "0px"})

    function openMenu(ev: any) {
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.pageX + "px", top: ev.pageY + "px"})
    }

    const liberations = useLiveQuery(() => db.liberations.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())

    function newSelectionLiberation(ev: any){
        const enseignantID = Number(ev.target.dataset.enseignantId)
        const allocationID = Number(ev.target.dataset.allocationId)

        const liberationsAllocation = liberations?.filter(liberation => liberation.allocation == allocationID)
        const sommeLiberations = liberationsAllocation?.reduce((somme, liberation) => somme + liberation.quantite, 0)

        const allocation = allocations?.find(allocation => allocation.id == allocationID)
        const qteAllocation = allocation?.quantite

        const qteRestante = String((qteAllocation! - sommeLiberations!).toFixed(2))

        const quantite = Number(prompt("Entrez la quantité de libération en ETC (max: " + qteRestante + ")", qteRestante))

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }

        if(sommeLiberations! + quantite > qteAllocation!){
            alert("La quantité de libération est trop grande pour l'allocation. Veuillez choisir une autre quantité")
            return
        }
        
        const liberation = {
            enseignant: enseignantID,
            allocation: allocationID,
            quantite: quantite
        }
        
        db.liberations.add(liberation)

        ev.target.value = ""
    }

    function dragOverHandlerLiberation(ev:any){
        ev.preventDefault()
    }

    function dropHandlerLiberation(ev:any){
        ev.currentTarget.style.boxShadow = "inset 0 0 0 0"
        const idNouveauEnseignant = Number(ev.currentTarget.dataset.enseignantId)

        if(!idNouveauEnseignant){
            return
        }

        const idLiberation = Number(ev.dataTransfer.getData("liberationId"))
        const idAncienEnseignant = Number(ev.dataTransfer.getData("enseignantId"))

        const ancienneLiberation = liberations?.find(liberation => liberation.enseignant == idAncienEnseignant && liberation.id == idLiberation)

        const liberationExiste = liberations?.find(liberation => liberation.enseignant == idNouveauEnseignant && liberation.allocation == ancienneLiberation?.allocation)
        
        if(liberationExiste){
            alert("Cet enseignant a deja cette liberation")
            return
        }

        const nouvelleLiberation = {
            enseignant: idNouveauEnseignant,
            allocation: ancienneLiberation?.allocation ?? 0,
            quantite: ancienneLiberation?.quantite ?? 0
        }

        db.liberations.add(nouvelleLiberation)

        db.liberations.delete(Number(ancienneLiberation?.id))
    }

    function removeHandlerLiberation(liberationId:any, enseignantId:any){
        db.liberations.delete(Number(liberationId))        
    }

    function dragEnter(ev:any){
        if(ev.currentTarget.dataset.dropzone == "liberation" && ev.dataTransfer.types.includes("liberationid")){
            ev.currentTarget.style.boxShadow = "inset 0 0 0 2px red"
        }
        if(ev.currentTarget.dataset.dropzone == "charge" && ev.dataTransfer.types.includes("groupeid")){
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
                
    return <td onContextMenu={openMenu} onMouseLeave={ev => {setHideMenu(true); ev.currentTarget.style.boxShadow = "inset 0 0 0 0"}} key={enseignant.id} data-enseignant-id={enseignant.id} data-dropzone="liberation" onDrop={dropHandlerLiberation} onDragOver={dragOverHandlerLiberation} onDragEnter={dragEnter} onDragLeave={dragLeave} style={{paddingBottom: "50px"}}>
        {liberationsEnseignant?.filter(liberation => {
            const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
            return allocation?.session == session
        })?.map((liberation: any) => {
            const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
            return <Liberation key={liberation?.id} session={session} liberation={liberation} allocation={allocation} enseignantId={enseignant.id} onRemove={removeHandlerLiberation}/>
        })}
        <div style={{position: "absolute", left: position.left, top: position.top, backgroundColor: "darkgrey", display: "block", padding: "5px"}} hidden={hideMenu}>
            {allocationsSession?.filter((allocation:any) => {
                const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
                const sommeLiberations = liberation?.reduce((somme, liberation) => somme + liberation.quantite, 0)
                const liberationExiste = liberations?.find(liberation => liberation.enseignant == enseignant.id && liberation.allocation == allocation.id)

                return allocation.quantite - sommeLiberations! > 0.001  && !liberationExiste
            })
            ?.toSorted((a:any, b:any) => a.description.localeCompare(b.description))
            ?.map((allocation: any, index:number) => {
                return <p key={index}>
                    <button  data-allocation-id={allocation.id} data-enseignant-id={enseignant.id} onClick={newSelectionLiberation}>
                        {allocation.code} - {allocation.description} ({allocation.quantite})
                    </button>
                </p>
            })}
        </div>
    </td>
}