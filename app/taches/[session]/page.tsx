'use client'

import { use, useEffect, useState } from "react"
import Groupe from "./Groupe"
import calculateur from "../../calculateur/calculateur"
import {groupesData, enseignantsData} from "../data"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../../db/db"
import { useParams } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"
import Liberation from "./Liberation"

export default function(){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const liberations = useLiveQuery(() => db.liberations.toArray())

    const params = useParams()

    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    function newSelection(ev: React.ChangeEvent<HTMLSelectElement>){
        const charge = {
            enseignant: Number(ev.target.dataset.enseignantId),
            groupe: Number(ev.target.options[ev.target.selectedIndex].dataset.id),
            nbSemaines: 15
        }

        db.charges.add(charge)

        ev.target.value = ""
    }
    
    function newLiberationSelection(ev: React.ChangeEvent<HTMLSelectElement>){
        const quantite = Number(prompt("Entrez la quantité de libération en ETC", "0.00"))

        if(isNaN(quantite)){
            alert("Erreur lors de l'entrée du nombre")
            return
        }
        
        const liberation = {
            enseignant: Number(ev.target.dataset.enseignantId),
            allocation: Number(ev.target.options[ev.target.selectedIndex].dataset.id),
            quantite: quantite
        }
        
        db.liberations.add(liberation)

        ev.target.value = ""
    }

    function dragOverHandler(ev:any){
        ev.preventDefault()
    }

    function dropHandler(ev:any){
        const idNouveauEnseignant = ev.target.dataset.enseignantId
        const idGroupe = ev.dataTransfer.getData("groupeId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        const ancienneCharge = charges?.find(charge => charge.enseignant == idAncienEnseignant && charge.groupe == idGroupe)

        db.charges.delete(Number(ancienneCharge?.id))

        const nouvelleCharge = {
            enseignant: idNouveauEnseignant,
            groupe: idGroupe,
            nbSemaines: 15
        }

        db.charges.add(nouvelleCharge)
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

    function removeHandler(groupeId:any, enseignantId:any){
        const charge = charges?.find(charge => charge.enseignant == enseignantId && charge.groupe == groupeId)

        db.charges.delete(Number(charge?.id))        
    }

    function removeHandlerLiberation(liberationId:any, enseignantId:any){
        db.liberations.delete(Number(liberationId))        
    }

    function liberationHandler(ev:any){
        /* const iEnseignant = enseignants.findIndex((e: any) => e.id == Number(ev.target.dataset.enseignantId))
        let enseignantsCopie = [...enseignants]
        enseignantsCopie[iEnseignant].liberations = Number(ev.target.value)
        setEnseignants(enseignantsCopie)
        console.log(enseignantsCopie) */
    }

    function stagiairesHandler(ev:any){
        /* const iEnseignant = enseignants.findIndex((e: any) => e.id == Number(ev.target.dataset.enseignantId))
        let enseignantsCopie = [...enseignants]
        enseignantsCopie[iEnseignant].stagiaires = Number(ev.target.value)
        setEnseignants(enseignantsCopie)
        console.log(enseignantsCopie) */
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
                            <select data-enseignant-id={enseignant.id} onChange={newSelection} value="">
                                <option></option>
                                {sortedGroupes?.filter((groupe:any) => {
                                    const charge = charges?.find(charge => charge.groupe == groupe.id)
                                    return charge == undefined
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
                        return <td key={enseignant.id} data-enseignant-id={enseignant.id} onDrop={dropHandler} onDragOver={dragOverHandler} style={{paddingBottom: "50px"}}>
                            {chargesEnseignant?.filter(charge => {
                                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                                return groupe?.session == params.session
                            })?.map((charge: any) => {
                                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                                const cour = cours?.find(cour => groupe?.cours == cour.id)
                                return <Groupe key={groupe?.id} groupe={groupe} cours={cour} enseignantId={enseignant.id} onRemove={removeHandler}/>
                            })}
                        </td>
                    })}
                </tr>
                <tr>
                    <th>Ajouter une libération</th>
                    {enseignants?.map(enseignant => {
                        const allocationsSession = allocations?.filter((allocation: any) => allocation.session == params.session)
                        return <td key={enseignant.id}>
                            <select data-enseignant-id={enseignant.id} onChange={newLiberationSelection} value="">
                                <option></option>
                                {allocationsSession?.filter((allocation:any) => {
                                    const liberation = liberations?.find(liberation => liberation.allocation == allocation.id)
                                    return liberation == undefined
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
                    {enseignants?.map(enseignant => (
                        <td key={enseignant.id}>
                            <input className="w-100" type="number" min="0" step="1" data-enseignant-id={enseignant.id} onChange={stagiairesHandler}/>
                        </td>
                    ))}
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