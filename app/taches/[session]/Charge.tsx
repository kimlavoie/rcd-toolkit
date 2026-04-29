import { db } from "@/app/db/db"
import { useState } from "react"

export default function({charge, groupe, cours, enseignantId, onRemove}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: "0px", top: "0px"})
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.pageX + "px", top: ev.pageY + "px"})
    }

    function supprimer(ev: any){
        onRemove(groupe.id, enseignantId)
        setHideMenu(true)
        
    }

    async function changerSemaines(ev: any){
        setHideMenu(true)
        const charges = await db.charges.toArray()
        const chargesGroupe = charges?.filter(charge => charge.groupe == groupe.id)
        const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + charge.nbSemaines, 0)

        const semainesRestantes = String(15 - sommeCharges! + charge.nbSemaines)

        const quantite = Number(prompt("Entrez le nombre de semaines (max: " + semainesRestantes + ")", semainesRestantes))

        if(quantite <= 0){
            return
        }
    
        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }
    
        if(sommeCharges! - charge.nbSemaines + quantite > 15){
            alert("La quantité de semaines de ce groupe est trop grande. Veuillez choisir un autre groupe ou une autre quantité")
            return
        }
    
        const nouvelleCharge = {nbSemaines: quantite}
    
        db.charges.update(charge.id, nouvelleCharge)
    }

    return <div onContextMenu={openMenu} onMouseLeave={ev => setHideMenu(true)} style={{border: "1px solid black", backgroundColor: cours.couleur}} draggable="true" onDragStart={dragStartHandler}>      
        <p style={{fontWeight: "bold"}}>{cours.sigle}</p>
        <p><span style={{fontWeight: "bold"}}>{cours.nom}</span> ({groupe.nbEtudiants})</p>
        {charge.nbSemaines < 15 && <p>Semaines: [{charge.nbSemaines}/15]</p> }
        <div style={{position: "absolute", left: position.left, top: position.top, backgroundColor: "darkgrey", display: "block", padding: "2px"}} hidden={hideMenu}>
            <p><button onClick={supprimer}>Supprimer</button></p>
            <p><button onClick={changerSemaines}>Changer les semaines</button></p>
        </div>
        <p></p>
    </div>
}