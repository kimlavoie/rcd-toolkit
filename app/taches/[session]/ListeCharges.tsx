import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import Charge from "./Charge";

export default function({enseignant, session}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: "0px", top: "0px"})

    const groupes = useLiveQuery(() => db.groupes.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())

    const groupesSession = groupes?.filter((groupe: any) => groupe.session == session)
    const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)

    function openMenu(ev: any) {
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX + "px", top: ev.clientY + "px"})
    }

    function newSelectionGroupe(ev: any){
        const enseignantID = Number(ev.target.dataset.enseignantId)
        const groupeID = Number(ev.target.dataset.groupeId)

        const chargesGroupe = charges?.filter(charge => charge.groupe == groupeID)
        const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + charge.nbSemaines, 0)

        const semainesRestantes = String(15 - sommeCharges!)

        const quantite = Number(prompt("Entrez le nombre de semaines (max: " + semainesRestantes + ")", semainesRestantes))

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }

        if(sommeCharges! + quantite > 15){
            alert("La quantité de semaines de ce groupe est trop grande. Veuillez choisir un autre groupe ou une autre quantité")
            return
        }

        const charge = {
            enseignant: enseignantID,
            groupe: groupeID,
            nbSemaines: quantite
        }

        db.charges.add(charge)

        ev.target.value = ""
    }

    function dropHandlerGroupe(ev:any){
        ev.currentTarget.style.boxShadow = "inset 0 0 0 0"
        const idNouveauEnseignant = Number(ev.currentTarget.dataset.enseignantId)

        if(!idNouveauEnseignant){
            return
        }

        const idGroupe = Number(ev.dataTransfer.getData("groupeId"))
        const idAncienEnseignant = Number(ev.dataTransfer.getData("enseignantId"))

        const ancienneCharge = charges?.find(charge => charge.enseignant == idAncienEnseignant && charge.groupe == idGroupe)

        const chargeExiste = charges?.find(charge => charge.enseignant == idNouveauEnseignant && charge.groupe == idGroupe)
        
        if(chargeExiste){
            alert("Cet enseignant a deja cette charge")
            return
        }

        const nouvelleCharge = {
            enseignant: idNouveauEnseignant,
            groupe: idGroupe,
            nbSemaines: ancienneCharge?.nbSemaines ?? 0
        }

        db.charges.add(nouvelleCharge)

        db.charges.delete(Number(ancienneCharge?.id))
    }

    function removeHandlerGroupe(groupeId:any, enseignantId:any){
        const charge = charges?.find(charge => charge.enseignant == enseignantId && charge.groupe == groupeId)

        db.charges.delete(Number(charge?.id))        
    }

    function dragOverHandlerGroupe(ev:any){
        ev.preventDefault()
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

    return <>
        <td onContextMenu={openMenu} onMouseLeave={ev => {setHideMenu(true); ev.currentTarget.style.boxShadow = "inset 0 0 0 0"}} key={enseignant.id} data-dropzone="charge" data-enseignant-id={enseignant.id} onDrop={dropHandlerGroupe} onDragOver={dragOverHandlerGroupe} onDragEnter={dragEnter} onDragLeave={dragLeave} style={{paddingBottom: "50px"}}>
            {chargesEnseignant?.filter(charge => {
                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                return groupe?.session == session
            })?.map((charge: any) => {
                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                const cour = cours?.find(cour => groupe?.cours == cour.id)
                return <Charge key={groupe?.id} session={session} charge={charge} groupe={groupe} cours={cour} enseignantId={enseignant.id} onRemove={removeHandlerGroupe}/>
            })}
            <div style={{position: "absolute", left: position.left, top: position.top, backgroundColor: "darkgrey", display: "block", padding: "5px"}} hidden={hideMenu}>
                {groupesSession?.filter((groupe:any) => {
                    const chargesGroupe = charges?.filter(charge => charge.groupe == groupe.id)
                    const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + charge.nbSemaines, 0)
                    const chargeExiste = charges?.find(charge => charge.enseignant == enseignant.id && charge.groupe == groupe.id)
                    return sommeCharges! < 15 && !chargeExiste
                })?.toSorted((a:any, b:any) => {
                    const coursA = cours?.find(cour => cour.id == a.cours)
                    const coursB = cours?.find(cour => cour.id == b.cours)
                    return coursA?.sigle.localeCompare(coursB?.sigle!)!
                })?.map((groupe: any, index:number) => {
                    const cour = cours?.find(cour => cour.id == groupe.cours)
                    return <p key={index}>
                        <button  data-groupe-id={groupe.id} data-enseignant-id={enseignant.id} onClick={newSelectionGroupe}>
                            {cour?.sigle} - {cour?.nom} ({groupe.nbEtudiants})
                        </button>
                    </p>
                })}
            </div>
        </td>
    </>
}