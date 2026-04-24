'use client'

import calculateur from "../../calculateur/calculateur"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../../db/db"
import { extractSessionInfos } from "@/app/utilities/sessions"
import Liberation from "./Liberation"
import Charge from "./Charge"

export default function({session}:any){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const supervisions = useLiveQuery(() => db.supervisions.toArray())

    const {saison, annee} = extractSessionInfos(session)

    function newSelectionGroupe(ev: React.ChangeEvent<HTMLSelectElement>){
        const enseignantID = Number(ev.target.dataset.enseignantId)
        const groupeID = Number(ev.target.options[ev.target.selectedIndex].dataset.id)

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

    function dragOverHandlerGroupe(ev:any){
        ev.preventDefault()
    }

    function dropHandlerGroupe(ev:any){
        const idNouveauEnseignant = ev.target.dataset.enseignantId

        if(!idNouveauEnseignant){
            return
        }

        const idGroupe = ev.dataTransfer.getData("groupeId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

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

    function newSelectionLiberation(ev: React.ChangeEvent<HTMLSelectElement>){
        const enseignantID = Number(ev.target.dataset.enseignantId)
        const allocationID = Number(ev.target.options[ev.target.selectedIndex].dataset.id)

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
        const idNouveauEnseignant = ev.target.dataset.enseignantId

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
        const nouvelleValeur = Number(ev.target.value)
        const supervision = supervisions?.find(supervision => supervision.enseignant == enseignantId && supervision.stage == stageId)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stageId && supervision.enseignant != enseignantId)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + supervision.nbStagiaires, 0)
        const stage = stages?.find(stage => stage.id == stageId)

        if(sommeSupervisions! + nouvelleValeur > stage?.nbStagiaires!){
            alert("La quantité de stagiaires est trop grande pour ce stage. Veuillez choisir une autre quantité")
            return
        }

        if(supervision){
            db.supervisions.update(Number(supervision.id), {nbStagiaires: nouvelleValeur})
        } else {
            db.supervisions.add({enseignant: enseignantId, stage: stageId, nbStagiaires: nouvelleValeur})
        }
    }

    function sortGroupes(groupes:any){
        return groupes
    }

    return <>
            <tr><th colSpan={100} style={{fontSize: "1.5em", backgroundColor: "#eeeeee"}}>{saison} {annee}</th></tr>
            
                <tr>
                    <th>Enseignants</th>
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => (
                        <th key={enseignant.id}>{enseignant.prenom} {enseignant.nom}</th>
                    ))}
                </tr>
                <tr>
                    <th>Ajouter un cours</th>
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => {
                        const groupesSession = groupes?.filter((groupe: any) => groupe.session == session)
                        const sortedGroupes = sortGroupes(groupesSession)
                        return <td key={enseignant.id}>
                            <select data-enseignant-id={enseignant.id} onChange={newSelectionGroupe} value="" style={{width: "50px"}}>
                                <option></option>
                                {sortedGroupes?.filter((groupe:any) => {
                                    const chargesGroupe = charges?.filter(charge => charge.groupe == groupe.id)
                                    const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + charge.nbSemaines, 0)
                                    const chargeExiste = charges?.find(charge => charge.enseignant == enseignant.id && charge.groupe == groupe.id)
                                    return sommeCharges! < 15 && !chargeExiste
                                })?.map((groupe: any, index:number) => {
                                    const cour = cours?.find(cour => cour.id == groupe.cours)
                                    return <option key={index} data-id={groupe.id}>
                                        {cour?.sigle} - {cour?.nom} ({groupe.nbEtudiants})
                                    </option>
                                })}
                            </select>
                        </td>
                    })}                    
                </tr>
                <tr>
                    <th>Cours Attribués</th>
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => {
                        const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                        return <td key={enseignant.id} data-enseignant-id={enseignant.id} onDrop={dropHandlerGroupe} onDragOver={dragOverHandlerGroupe} style={{paddingBottom: "50px"}}>
                            {chargesEnseignant?.filter(charge => {
                                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                                return groupe?.session == session
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
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => {
                        const allocationsSession = allocations?.filter((allocation: any) => allocation.session == session)
                        return <td key={enseignant.id}>
                            <select data-enseignant-id={enseignant.id} onChange={newSelectionLiberation} value="" style={{width: "50px"}}>
                                <option></option>
                                {allocationsSession?.filter((allocation:any) => {
                                    const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
                                    const sommeLiberations = liberation?.reduce((somme, liberation) => somme + liberation.quantite, 0)
                                    const liberationExiste = liberations?.find(liberation => liberation.enseignant == enseignant.id && liberation.allocation == allocation.id)

                                    return allocation.quantite - sommeLiberations! > 0.001  && !liberationExiste
                                })?.map((allocation: any, index:number) => {
                                    return <option key={index} data-id={allocation.id}>
                                        {allocation.code} - {allocation.description} ({allocation.quantite})
                                    </option>
                                })}
                            </select>
                        </td>
                    })}                    
                </tr>
                <tr>
                    <th>Libérations Attribuées</th>
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => {
                        const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                        return <td key={enseignant.id} data-enseignant-id={enseignant.id} onDrop={dropHandlerLiberation} onDragOver={dragOverHandlerLiberation} style={{paddingBottom: "50px"}}>
                            {liberationsEnseignant?.filter(liberation => {
                                const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
                                return allocation?.session == session
                            })?.map((liberation: any) => {
                                const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
                                return <Liberation key={liberation?.id} liberation={liberation} allocation={allocation} enseignantId={enseignant.id} onRemove={removeHandlerLiberation}/>
                            })}
                        </td>
                    })}
                </tr>
                <tr>
                    <th>Stagiaires</th>
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => {
                        const stage = stages?.find(stage => stage.session == session)
                        const supervision = supervisions?.find(supervision => supervision.stage == stage?.id && supervision.enseignant == enseignant.id)
                        const value = supervision ? supervision.nbStagiaires : 0
                        return stage 
                            ?<td key={enseignant.id}>
                                <p><input className="w-100" type="number" min="0" step="1" value={value} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={stagiairesHandler}/>/{stage.nbStagiaires}</p>
                            </td>
                            :<td key={enseignant.id}>Aucun stage</td>
                    })}
                </tr>
                <tr>
                    <th>CI</th>
                    {enseignants?.toSorted((a, b) => a.prenom.localeCompare(b.prenom))
                    .map(enseignant => {
                        const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                        const groupesSession = groupes?.filter(groupe => groupe.session == session)
                        const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
                        const chargesInfos = chargesSession?.map(charge => {
                            const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
                            const cour = cours?.find(cour => groupe?.cours == cour.id)
                            return {sigle: cour?.sigle!, etudiants: groupe?.nbEtudiants!, heures: cour?.heuresTheorie! + cour?.heuresPratique!, semaines: charge.nbSemaines}
                        })

                        const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                        const allocationsSession = allocations?.filter(allocation => allocation.session == session)
                        const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))
                        const liberationsInfos = liberationsSession?.map(liberation => {
                            return {qte: liberation.quantite}
                        })

                        const supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
                        const stagesSession = stages?.filter(stage => stage.session == session)
                        const supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
                        const stagiaires = supervisionsSession?.nbStagiaires ?? 0
                        const ETCparStagiaire = stagesSession?.[0]?.ETCparStagiaire ?? 0

                        const CI = calculateur(chargesInfos!, liberationsInfos!, stagiaires, ETCparStagiaire).total
                        const couleur = CI < 30 ? "black" : CI < 40 ? "darkkhaki" : CI < 45 ? "green" : CI < 55 ? "orange" : "red"
                        return <th key={enseignant.id} style={{color: couleur}}>
                            {CI.toFixed(2)}
                        </th>
                    })}
                </tr>
    </>
}