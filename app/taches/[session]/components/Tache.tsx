'use client'
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import ListeCharges from "./ListeCharges"
import ListeLiberations from "./ListeLiberations"
import CI from "./CI"
import type { Enseignant, Groupe, Charge, Allocation, Liberation, Stage, Supervision } from "@/app/db/db"
import { toast } from "react-hot-toast"

export default function({cache, session, tri, firstColWidth, enseignantWidth}:any){
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const charges = useFirestoreCollection<Charge>("charges")
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const liberations = useFirestoreCollection<Liberation>("liberations")
    const stages = useFirestoreCollection<Stage>("stages")
    const supervisions = useFirestoreCollection<Supervision>("supervisions")

    const {saison, annee} = extractSessionInfos(session)

    function chargesManquantes(session:string){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)

        const missing = groupesSession?.filter(groupe => {
            const charge = charges?.filter(charge => charge.groupe == groupe.id)
            const sommeCharges = charge?.reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
            return 15 - (sommeCharges ?? 0) > 0.001
        })

        return missing?.length
    }

    function liberationsManquantes(session:string){
        const allocationsSession = allocations?.filter(allocation => allocation.session == session)

        const missing = allocationsSession?.filter(allocation => {
            const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
            const sommeLiberations = liberation?.reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0)
            return (allocation.quantite ?? 0) - (sommeLiberations ?? 0) > 0.001
        })

        return missing?.length
    }

    function stagiairesRestants(){
        const stage = stages?.find(stage => stage.session == session)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stage?.id)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + (supervision.nbStagiaires ?? 0), 0)
        return (stage?.nbStagiaires ?? 0) - (sommeSupervisions ?? 0)
    }

    async function stagiairesHandler(ev:any){
        const enseignantId = ev.target.dataset.enseignantId
        const stageId = ev.target.dataset.stageId
        const nouvelleValeur = Number(ev.target.value)
        const supervision = supervisions?.find(supervision => supervision.enseignant == enseignantId && supervision.stage == stageId)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stageId && supervision.enseignant != enseignantId)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + (supervision.nbStagiaires ?? 0), 0)
        const stage = stages?.find(stage => stage.id == stageId)

        if((sommeSupervisions ?? 0) + nouvelleValeur > (stage?.nbStagiaires ?? 0)){
            toast.error("La quantité de stagiaires est trop grande pour ce stage. Veuillez choisir une autre quantité")
            return
        }

        if(supervision){
            await firebaseDb.supervisions.update(supervision.id, {nbStagiaires: nouvelleValeur})
        } else {
            await firebaseDb.supervisions.add({enseignant: enseignantId, stage: stageId, nbStagiaires: nouvelleValeur})
        }
    }

    async function clearStagiaires(){
        const stageSession = stages?.find(stage => stage.session == session)
        const supervisionStage = supervisions?.filter(supervision => supervision.stage == stageSession?.id)
        for (const supervision of (supervisionStage ?? [])) {
            await firebaseDb.supervisions.delete(supervision.id)
        }
    }

    async function clearLiberations(){
        const allocationsSession = allocations?.filter(allocation => allocation.session == session)
        const liberationsSession = liberations?.filter(liberation => {
            const allocation = allocationsSession?.find(allocation => allocation.id == liberation.allocation)
            return allocation
        })
        for (const liberation of (liberationsSession ?? [])) {
            await firebaseDb.liberations.delete(liberation.id)
        }
    }

    async function clearCharges(){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)
        const chargesSession = charges?.filter(charge => {
            const groupe = groupesSession?.find(groupe => groupe.id == charge.groupe)
            return groupe
        })
        for (const charge of (chargesSession ?? [])) {
            await firebaseDb.charges.delete(charge.id)
        }
    }
    
    async function clearAll(){
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les données pour la session ${saison} ${annee} ?`)) {
            await clearStagiaires()
            await clearLiberations()
            await clearCharges()
        }
    }

    const firstColStyle = {
        position: "sticky" as const, 
        left: 0, 
        zIndex: 101, 
        backgroundColor: "white",
        minWidth: `${firstColWidth}px`,
        width: `${firstColWidth}px`
    }

    return <>
        <tr className="table-secondary">
            <th colSpan={100} style={{fontSize: "1.2em", backgroundColor: "#e9ecef", position: "sticky", left: 0, zIndex: 101, minWidth: `${firstColWidth}px`}}>
                <div className="d-flex justify-content-between align-items-center">
                    <span>{saison} {annee}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearAll}>Réinitialiser la session ⟲</button>
                </div>
            </th>
        </tr>
        <tr>
            <th style={firstColStyle}>
                <p className="mb-1">Cours Attribués</p>
                <p className="small mb-0">{
                    (chargesManquantes(session) ?? 0) > 0
                    ?<span className="badge bg-danger">{(chargesManquantes(session) ?? 0)} restants</span>
                    :<span className="badge bg-success">Complet</span>
                }</p>
            </th>
            { (enseignants ?? [])
            .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))
            .filter(enseignant => !cache.includes(enseignant.id))
            .map(enseignant => {
                return <ListeCharges key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={enseignantWidth}/>
            })}
        </tr>
        <tr>
            <th style={firstColStyle}>
                <p className="mb-1">Libérations</p>
                <p className="small mb-0">{
                    (liberationsManquantes(session) ?? 0) > 0
                    ?<span className="badge bg-warning text-dark">{(liberationsManquantes(session) ?? 0)} restantes</span>
                    :<span className="badge bg-success">Toutes attribuées</span>
                }
                </p>
            </th>
            { (enseignants ?? [])
            .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))
            .filter(enseignant => !cache.includes(enseignant.id))
            .map(enseignant => {
                return <ListeLiberations key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={enseignantWidth}/>
            })}
        </tr>
        <tr>
            <th style={firstColStyle}>
                <p className="mb-1">Stagiaires</p> 
                <p className="small mb-0">{
                    !isNaN(stagiairesRestants())
                    && (stagiairesRestants() > 0
                    ?<span className="badge bg-info text-dark">{stagiairesRestants()} à placer</span>
                    :<span className="badge bg-success">Tous placés</span>)
                }
                </p>
            </th>
            { (enseignants ?? [])
            .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))
            .filter(enseignant => !cache.includes(enseignant.id))
            .map(enseignant => {
                const stage = stages?.find(stage => stage.session == session)
                const supervision = supervisions?.find(supervision => supervision.stage == stage?.id && supervision.enseignant == enseignant.id)
                const value = supervision ? supervision.nbStagiaires : 0
                return stage 
                    ?<td key={enseignant.id} className="text-center" style={{minWidth: `${enseignantWidth}px`, width: `${enseignantWidth}px`}}>
                        <div className="input-group input-group-sm">
                            <input className="form-control text-center" type="number" min="0" step="1" value={value} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={stagiairesHandler}/>
                            <span className="input-group-text">/{stage.nbStagiaires}</span>
                        </div>
                    </td>
                    :<td key={enseignant.id} className="text-muted text-center small" style={{minWidth: `${enseignantWidth}px`, width: `${enseignantWidth}px`}}>Aucun stage</td>
            })}
        </tr>
        <tr>
            <th style={firstColStyle}>CI {saison}</th>
            { (enseignants ?? [])
            .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))
            .filter(enseignant => !cache.includes(enseignant.id))
            .map(enseignant => {
                return <CI key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={enseignantWidth} trigger={{charges, liberations, groupes}}/>
            })}
        </tr>
    </>
}