'use client'

import { use, useEffect, useState } from "react"
import calculateur from "../../calculateur/calculateur"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../../db/db"
import { useParams } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"
import Liberation from "./Liberation"
import Charge from "./Charge"

export default function(){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const supervisions = useLiveQuery(() => db.supervisions.toArray())

    const params = useParams()

    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    function newSelectionGroupe(ev: React.ChangeEvent<HTMLSelectElement>){
        const quantite = Number(prompt("Entrez le nombre de semaines", "15"))

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }

        const enseignantID = Number(ev.target.dataset.enseignantId)
        const groupeID = Number(ev.target.options[ev.target.selectedIndex].dataset.id)

        const chargesGroupe = charges?.filter(charge => charge.groupe == groupeID)
        const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + charge.nbSemaines, 0)

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

    function dragOverHandlerGroupe(ev:any){
        ev.preventDefault()
    }

    function dropHandlerGroupe(ev:any){
        const idNouveauEnseignant = ev.target.dataset.enseignantId
        const idGroupe = ev.dataTransfer.getData("groupeId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        const ancienneCharge = charges?.find(charge => charge.enseignant == idAncienEnseignant && charge.groupe == idGroupe)

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

    function newSelectionLiberation(ev: React.ChangeEvent<HTMLSelectElement>){
        const quantite = Number(prompt("Entrez la quantité de libération en ETC", "0.00"))

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }


        const enseignantID = Number(ev.target.dataset.enseignantId)
        const allocationID = Number(ev.target.options[ev.target.selectedIndex].dataset.id)

        const liberationsAllocation = liberations?.filter(liberation => liberation.allocation == allocationID)
        const sommeLiberations = liberationsAllocation?.reduce((somme, liberation) => somme + liberation.quantite, 0)

        const allocation = allocations?.find(allocation => allocation.id == allocationID)
        const qteAllocation = allocation?.quantite

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
        const idNouveauEnseignant = ev.target.dataset.enseignantId
        const idLiberation = ev.dataTransfer.getData("liberationId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        const ancienneLiberation = liberations?.find(liberation => liberation.enseignant == idAncienEnseignant && liberation.id == idLiberation)

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

    function stagiairesHandler(ev:any){
        const enseignantId = Number(ev.target.dataset.enseignantId)
        const stageId = Number(ev.target.dataset.stageId)
        const supervision = supervisions?.find(supervision => supervision.enseignant == enseignantId && supervision.stage == stageId)
        console.log(supervision)

        if(supervision){
            db.supervisions.update(Number(supervision.id), {nbStagiaires: Number(ev.target.value)})
        } else {
            console.log("Without supervision")
            db.supervisions.add({enseignant: Number(ev.target.dataset.enseignantId), stage: Number(ev.target.dataset.stageId), nbStagiaires: Number(ev.target.value)})
        }
    }

    function sortGroupes(groupes:any){
        return groupes
    }

    return <>
    <h1>{saison} {annee}</h1>
    <div style={{width: "100%"}}>
        <table className="table table-bordered" data-toggle="table" data-resizable="true" >
            <thead>
                <tr>
                    <th>Enseignants</th>
                    {enseignants?.map(enseignant => (
                        <th key={enseignant.id}>{enseignant.prenom} {enseignant.nom}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>Ajouter un cours</th>
                    {enseignants?.map(enseignant => {
                        const groupesSession = groupes?.filter((groupe: any) => groupe.session == params.session)
                        const sortedGroupes = sortGroupes(groupesSession)
                        return <td key={enseignant.id}>
                            <select data-enseignant-id={enseignant.id} onChange={newSelectionGroupe} value="">
                                <option></option>
                                {sortedGroupes?.filter((groupe:any) => {
                                    const chargesGroupe = charges?.filter(charge => charge.groupe == groupe.id)
                                    const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + charge.nbSemaines, 0)
                                    const chargeExiste = charges?.find(charge => charge.enseignant == enseignant.id && charge.groupe == groupe.id)
                                    return sommeCharges! < 15 && !chargeExiste
                                })?.map((groupe: any, index:number) => {
                                    const cour = cours?.find(cour => cour.id == groupe.cours)
                                    return <option key={index} data-id={groupe.id}>
                                        {cour?.sigle} - {cour?.nom.substring(0,20)} ({groupe.nbEtudiants})
                                    </option>
                                })}
                            </select>
                        </td>
                    })}                    
                </tr>
                <tr>
                    <th>Cours Attribués</th>
                    {enseignants?.map(enseignant => {
                        const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                        return <td key={enseignant.id} data-enseignant-id={enseignant.id} onDrop={dropHandlerGroupe} onDragOver={dragOverHandlerGroupe} style={{paddingBottom: "50px"}}>
                            {chargesEnseignant?.filter(charge => {
                                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                                return groupe?.session == params.session
                            })?.map((charge: any) => {
                                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                                const cour = cours?.find(cour => groupe?.cours == cour.id)
                                return <Charge key={groupe?.id} charge={charge} groupe={groupe} cours={cour} enseignantId={enseignant.id} onRemove={removeHandlerGroupe}/>
                            })}
                        </td>
                    })}
                </tr>
                <tr>
                    <th>Ajouter une libération</th>
                    {enseignants?.map(enseignant => {
                        const allocationsSession = allocations?.filter((allocation: any) => allocation.session == params.session)
                        return <td key={enseignant.id}>
                            <select data-enseignant-id={enseignant.id} onChange={newSelectionLiberation} value="">
                                <option></option>
                                {allocationsSession?.filter((allocation:any) => {
                                    const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
                                    const sommeLiberations = liberation?.reduce((somme, liberation) => somme + liberation.quantite, 0)
                                    const liberationExiste = liberations?.find(liberation => liberation.enseignant == enseignant.id && liberation.allocation == allocation.id)

                                    return sommeLiberations! < allocation.quantite && !liberationExiste
                                })?.map((allocation: any, index:number) => {
                                    return <option key={index} data-id={allocation.id}>
                                        {allocation.code} - {allocation.description.substring(0,20)} ({allocation.quantite})
                                    </option>
                                })}
                            </select>
                        </td>
                    })}                    
                </tr>
                <tr>
                    <th>Libérations Attribuées</th>
                    {enseignants?.map(enseignant => {
                        const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                        return <td key={enseignant.id} data-enseignant-id={enseignant.id} onDrop={dropHandlerLiberation} onDragOver={dragOverHandlerLiberation} style={{paddingBottom: "50px"}}>
                            {liberationsEnseignant?.filter(liberation => {
                                const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
                                return allocation?.session == params.session
                            })?.map((liberation: any) => {
                                const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
                                return <Liberation key={liberation?.id} liberation={liberation} allocation={allocation} enseignantId={enseignant.id} onRemove={removeHandlerLiberation}/>
                            })}
                        </td>
                    })}
                </tr>
                <tr>
                    <th>Stagiaires</th>
                    {enseignants?.map(enseignant => {
                        const stage = stages?.find(stage => stage.session == params.session)
                        const supervision = supervisions?.find(supervision => supervision.stage == stage?.id && supervision.enseignant == enseignant.id)
                        const value = supervision ? supervision.nbStagiaires : 0
                        console.log(value)
                        return stage 
                            ?<td key={enseignant.id}>
                                <p><input className="w-100" type="number" min="0" step="1" value={value} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={stagiairesHandler}/>/{stage.nbStagiaires}</p>
                            </td>
                            :<td key={enseignant.id}>Aucun stage</td>
                    })}
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <th>CI</th>
                    {enseignants?.map(enseignant => {
                        return <th key={enseignant.id}>TODO</th>
                        {/* <th key={enseignant.id}>
                            {calculateur(enseignant.groupes, [{qte: enseignant.liberations}], enseignant.stagiaires).total}
                        </th> */}
                    })}
                </tr>
            </tfoot>
        </table>
        </div>
    </>
}