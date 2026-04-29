import { db } from "@/app/db/db"
import { useState } from "react"

export default function({session, liberation, allocation, enseignantId, onRemove}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: "0px", top: "0px"})

    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("liberationId", liberation.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.pageX + "px", top: ev.pageY + "px"})
    }

    function supprimer(ev: any){
        onRemove(liberation.id, enseignantId)
        setHideMenu(true)
        
    }

    async function changerQuantite(ev: any){
        setHideMenu(true)
        const liberations = await db.liberations.toArray()

        const liberationsAllocation = liberations?.filter(liberation => liberation.allocation == allocation?.id)
        const sommeLiberations = liberationsAllocation?.reduce((somme, liberation) => somme + liberation.quantite, 0)

        const qteAllocation = allocation?.quantite

        const qteRestante = String((qteAllocation! - sommeLiberations! + liberation.quantite).toFixed(2))

        const quantite = Number(prompt("Entrez la quantité de libération en ETC (max: " + qteRestante + ")", qteRestante))

        if(quantite <= 0){
            return
        }

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }

        if(sommeLiberations! + quantite - liberation.quantite > qteAllocation!){
            alert("La quantité de libération est trop grande pour l'allocation. Veuillez choisir une autre quantité")
            return
        }
        const nouvelleLiberation = {quantite: quantite}
        db.liberations.update(liberation.id, nouvelleLiberation)
    }

    function modifierAllocation(ev: any){
        window.open("/admin/allocations/" + session + "/" + allocation.id, "_blank")
    }

    return <div onContextMenu={openMenu} onMouseLeave={ev => setHideMenu(true)} style={{border: "1px solid black"}} draggable="true" onDragStart={dragStartHandler}>      
        <p>{allocation.code} - {allocation.description}</p>
        <p>({liberation.quantite}/{allocation.quantite})</p>
        <div style={{position: "absolute", left: position.left, top: position.top, backgroundColor: "darkgrey", display: "block", padding: "2px"}} hidden={hideMenu}>
            <p><button onClick={supprimer}>Supprimer</button></p>
            <p><button onClick={changerQuantite}>Changer la quantité</button></p>
            <p><button onClick={modifierAllocation}>Modifier l'allocation</button></p>
        </div>
    </div>
}