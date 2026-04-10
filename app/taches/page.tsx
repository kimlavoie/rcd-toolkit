'use client'

import { useState } from "react"
import Groupe from "./Groupe"
import calculateur from "../calculateur/calculateur"
import {groupesData, enseignantsData} from "./data"

export default function(){
    const [groupes, setGroupes] = useState(groupesData)
    const [enseignants, setEnseignants] = useState(enseignantsData)

    function newSelection(ev: React.ChangeEvent<HTMLSelectElement>){
        console.log(`Sélectionné ${ev.target.value} pour l'enseignant #${ev.target.dataset.enseignantId}`)

        let enseignantsCopie: any = [...enseignants]
        let groupesCopie: any = [...groupes]
        const idEnseignant = ev.target.dataset.enseignantId ?? ""
        const idOption = ev.target.options[ev.target.selectedIndex].dataset.id

        const iEnseignant = enseignantsCopie.findIndex((e: any) => e.id == Number(idEnseignant))
        const iOption = groupes.findIndex((e: any) => e.id == Number(idOption))

        enseignantsCopie[iEnseignant].groupes.push(groupes[iOption])
        groupesCopie.splice(iOption,1)
        console.log(enseignantsCopie)

        setEnseignants(enseignantsCopie)
        setGroupes(groupesCopie)

        ev.target.value = ""
    }

    function dragOverHandler(ev:any){
        ev.preventDefault()
    }

    function dropHandler(ev:any){
        ev.preventDefault()
        const idNouveauEnseignant = ev.target.dataset.enseignantId
        const idGroupe = ev.dataTransfer.getData("groupeId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")
        
        let enseignantsCopie: any = [...enseignants]
        const iNouveau = enseignantsCopie.findIndex((e: any) => e.id == Number(idNouveauEnseignant))
        const iAncien = enseignantsCopie.findIndex((e: any) => e.id == Number(idAncienEnseignant))
        const iGroupe = enseignantsCopie[iAncien].groupes.findIndex((e:any) => e.id == idGroupe)

        enseignantsCopie[iNouveau].groupes.push(enseignantsCopie[iAncien].groupes[iGroupe])
        enseignantsCopie[iAncien].groupes.splice(iGroupe, 1)

        console.log(enseignantsCopie)

        setEnseignants(enseignantsCopie)
    }

    function removeHandler(groupeId:any, enseignantId:any){
        const iEnseignant = enseignants.findIndex((e: any) => e.id == Number(enseignantId))
        const iGroupe = enseignants[iEnseignant].groupes.findIndex((e: any) => e.id == Number(groupeId))

        let groupesCopie = [...groupes]
        groupesCopie.push(enseignants[iEnseignant].groupes[iGroupe])

        let enseignantsCopie = [...enseignants]
        enseignantsCopie[iEnseignant].groupes.splice(iGroupe, 1)

        
        setEnseignants(enseignantsCopie)
        setGroupes(groupesCopie)
        
    }

    function liberationHandler(ev:any){
        const iEnseignant = enseignants.findIndex((e: any) => e.id == Number(ev.target.dataset.enseignantId))
        let enseignantsCopie = [...enseignants]
        enseignantsCopie[iEnseignant].liberations = Number(ev.target.value)
        setEnseignants(enseignantsCopie)
        console.log(enseignantsCopie)
    }

    function stagiairesHandler(ev:any){
        const iEnseignant = enseignants.findIndex((e: any) => e.id == Number(ev.target.dataset.enseignantId))
        let enseignantsCopie = [...enseignants]
        enseignantsCopie[iEnseignant].stagiaires = Number(ev.target.value)
        setEnseignants(enseignantsCopie)
        console.log(enseignantsCopie)
    }

    return <>
        <table className="table table-bordered">
            <thead>
                <tr>
                    <th>Enseignants</th>
                    {enseignants.map(enseignant => (
                        <th  key={enseignant.id}>{enseignant.nom}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>Ajouter un cours</th>
                    {enseignants.map(enseignant => (
                        <td key={enseignant.id}>
                            <select data-enseignant-id={enseignant.id} onChange={newSelection} value="">
                                <option></option>
                                {groupes.sort((a,b) => a.sigle.localeCompare(b.sigle)).map((groupe, index) => (
                                    <option key={index} data-id={groupe.id}>
                                        {groupe.sigle} - {groupe.titre} ({groupe.etudiants})
                                    </option>
                                ))}
                            </select>
                        </td>
                    ))}                    
                </tr>
                <tr>
                    <th>Cours Attribués</th>
                    {enseignants.map(enseignant => (
                        <td key={enseignant.id} data-enseignant-id={enseignant.id} onDrop={dropHandler} onDragOver={dragOverHandler} style={{paddingBottom: "50px"}}>
                            {enseignant.groupes.sort((a:any,b:any) => a.sigle.localeCompare(b.sigle)).map((groupe: any) => (
                                <Groupe key={groupe.id} groupe={groupe} enseignantId={enseignant.id} onRemove={removeHandler}/>
                            ))}
                        </td>
                    ))}
                </tr>
                <tr>
                    <th>Libérations</th>
                    {enseignants.map(enseignant => (
                        <td key={enseignant.id}>
                            <input type="number" min="0" max="1" step="0.05"  data-enseignant-id={enseignant.id} onChange={liberationHandler} />
                        </td>
                    ))}
                </tr>
                <tr>
                    <th>Stagiaires</th>
                    {enseignants.map(enseignant => (
                        <td key={enseignant.id}>
                            <input type="number" min="0" step="1" data-enseignant-id={enseignant.id} onChange={stagiairesHandler}/>
                        </td>
                    ))}
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <th>CI</th>
                    {enseignants.map(enseignant => (
                        <th key={enseignant.id}>
                            {calculateur(enseignant.groupes, [{qte: enseignant.liberations}], enseignant.stagiaires).total}
                        </th>
                    ))}
                </tr>
            </tfoot>
        </table>
    </>
}