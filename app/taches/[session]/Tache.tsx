'use client'

import calculateur from "../../calculateur/calculateur"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../../db/db"
import { extractSessionInfos } from "@/app/utilities/sessions"
import Liberation from "./Liberation"
import ListeCharges from "./ListeCharges"

export default function({cache, session, tri}:any){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const supervisions = useLiveQuery(() => db.supervisions.toArray())

    const {saison, annee} = extractSessionInfos(session)

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

    function chargesManquantes(session:string){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)

        const chargesManquantes = groupesSession?.filter(groupe => {
            const charge = charges?.filter(charge => charge.groupe == groupe.id)
            const sommeCharges = charge?.reduce((somme, charge) => somme + charge.nbSemaines, 0)
            return 15 - sommeCharges! > 0.001
        })

        return chargesManquantes?.length

    }

    function liberationsManquantes(session:string){


        const allocationsSession = allocations?.filter(allocation => allocation.session == session)

        const liberationsManquantes = allocationsSession?.filter(allocation => {
            const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
            const sommeLiberations = liberation?.reduce((somme, liberation) => somme + liberation.quantite, 0)
            return allocation.quantite - sommeLiberations! > 0.001
        })

        return liberationsManquantes?.length
    }

    function stagiairesRestants(){
        const stage = stages?.find(stage => stage.session == session)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stage?.id)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + supervision.nbStagiaires, 0)
        return stage?.nbStagiaires! - sommeSupervisions!
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

    async function clearStagiaires(){
        const stageSession = stages?.find(stage => stage.session == session)
        const supervisionStage = supervisions?.filter(supervision => supervision.stage == stageSession?.id)
        supervisionStage?.forEach(supervision => db.supervisions.delete(Number(supervision.id)))
    }

    async function clearLiberations(){
        const allocationsSession = allocations?.filter(allocation => allocation.session == session)
        const liberationsSession = liberations?.filter(liberation => {
            const allocation = allocationsSession?.find(allocation => allocation.id == liberation.allocation)
            return allocation
        })
        liberationsSession?.forEach(liberation => db.liberations.delete(Number(liberation.id)))
    }

    async function clearCharges(){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)
        const chargesSession = charges?.filter(charge => {
            const groupe = groupesSession?.find(groupe => groupe.id == charge.groupe)
            return groupe
        })
        chargesSession?.forEach(charge => db.charges.delete(Number(charge.id)))
    }
    
    async function clearAll(){
        await clearStagiaires()
        await clearLiberations()
        await clearCharges()
    }

    return <>
        <tr><th colSpan={100} style={{fontSize: "1.5em", backgroundColor: "#eeeeee"}}>
            {saison} {annee}
            <button type="button" className="btn btn-primary rounded-circle" style={{float: "right", padding: "0px 5px"}} onClick={clearAll}>⟲</button>
            </th>
        </tr>
        <tr>
            <th>
                <button type="button" onClick={clearCharges} className="btn btn-primary rounded-circle" style={{float: "right", padding: "0px 5px"}}>⟲</button>  
                <p>Cours Attribués</p>
                <p>{
                    chargesManquantes(session)! > 0
                    ?<span style={{color: "red"}}>{chargesManquantes(session)!} restants</span>
                    :<span style={{color: "green"}}>{chargesManquantes(session)!} restants</span>
                }</p>
            </th>
            {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
            .filter(enseignant => !cache.includes(enseignant.id))
            .map(enseignant => {
                return <ListeCharges key={enseignant.id} enseignant={enseignant} session={session}/>
            })}
        </tr>
        <tr>
            <th>
                <p>Attribuer une libération</p>
            </th>
            {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
            .filter(enseignant => !cache.includes(enseignant.id))
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
                        })
                        ?.toSorted((a:any, b:any) => a.description.localeCompare(b.description))
                        ?.map((allocation: any, index:number) => {
                            return <option key={index} data-id={allocation.id}>
                                {allocation.code} - {allocation.description} ({allocation.quantite})
                            </option>
                        })}
                    </select>
                </td>
            })}                    
        </tr>
        <tr>
            <th>
                <button type="button" onClick={clearLiberations} className="btn btn-primary rounded-circle" style={{float: "right", padding: "0px 5px"}}>⟲</button>   
                <p>Libérations Attribuées</p>
                <p>{
                    liberationsManquantes(session)! > 0
                    ?<span style={{color: "red"}}>{liberationsManquantes(session)!} restantes</span>
                    :<span style={{color: "green"}}>{liberationsManquantes(session)!} restantes</span>
                }
                </p>
            </th>
            {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
            .filter(enseignant => !cache.includes(enseignant.id))
            .map(enseignant => {
                const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                return <td key={enseignant.id} data-enseignant-id={enseignant.id} data-dropzone="liberation" onDrop={dropHandlerLiberation} onDragOver={dragOverHandlerLiberation} onDragEnter={dragEnter} onDragLeave={dragLeave}>
                    {liberationsEnseignant?.filter(liberation => {
                        const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
                        return allocation?.session == session
                    })?.map((liberation: any) => {
                        const allocation:any = allocations?.find(allocation => liberation.allocation == allocation.id)
                        return <Liberation key={liberation?.id} session={session} liberation={liberation} allocation={allocation} enseignantId={enseignant.id} onRemove={removeHandlerLiberation}/>
                    })}
                </td>
            })}
        </tr>
        <tr>
            <th>
                <p>Stagiaires 
                    <button type="button" onClick={clearStagiaires} className="btn btn-primary rounded-circle" style={{float: "right", padding: "0px 5px"}}>⟲</button>    
                </p> 
                <p>{
                    !isNaN(stagiairesRestants())
                    && (stagiairesRestants() > 0
                    ?<span style={{color: "red"}}>{stagiairesRestants()} restants</span>
                    :<span style={{color: "green"}}>{stagiairesRestants()} restants</span>)
                }
                </p>
            </th>
            {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
            .filter(enseignant => !cache.includes(enseignant.id))
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
            <th>CI Session</th>
            {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
            .filter(enseignant => !cache.includes(enseignant.id))
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