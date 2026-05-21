'use client'
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import ListeCharges from "./ListeCharges"
import ListeLiberations from "./ListeLiberations"
import CI from "./CI"
import type { Enseignant, Groupe, Charge, Allocation, Liberation, Stage, Supervision } from "@/app/db/db"
import { toast } from "react-hot-toast"

export default function({visibleEnseignants, session, enseignantWidth, scenario = "production", ciBottom, ciTop}:any){
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const allCharges = useFirestoreCollection<Charge>("charges")
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const allLiberations = useFirestoreCollection<Liberation>("liberations")
    const stages = useFirestoreCollection<Stage>("stages")
    const allSupervisions = useFirestoreCollection<Supervision>("supervisions")

    const {saison, annee} = extractSessionInfos(session)

    // Filter data by scenario
    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario)
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario)
    const supervisions = allSupervisions?.filter(s => (s.scenario || "production") === scenario)

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
            await firebaseDb.supervisions.add({enseignant: enseignantId, stage: stageId, nbStagiaires: nouvelleValeur, scenario})
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
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les données pour la session ${saison} ${annee} (Scénario: ${scenario}) ?`)) {
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
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        borderRight: "2px solid #dee2e6",
        borderBottom: "1px solid #dee2e6",
        padding: "4px 12px",
        fontSize: "0.8rem",
        whiteSpace: "nowrap" as const,
        width: "1px",
        backgroundClip: "padding-box"
    }

    const cellStyle = {
        borderRight: "1px solid #dee2e6",
        borderBottom: "1px solid #dee2e6",
        minWidth: `${enseignantWidth}px`,
        width: `${enseignantWidth}px`
    }

    const ciHeaderStyle = {
        ...firstColStyle,
        position: "sticky" as const,
        bottom: ciBottom,
        top: ciTop,
        zIndex: 103,
        backgroundColor: "#f8f9fa",
        borderTop: ciBottom ? "1px solid #dee2e6" : "none",
        borderBottom: ciTop ? "2px solid #dee2e6" : "1px solid #dee2e6"
    }

    return <>
        <tr className="table-secondary">
            <th style={{...firstColStyle, backgroundColor: "#e9ecef", zIndex: 102}}>
                <div className="d-flex justify-content-between align-items-center gap-4">
                    <span className="fw-bold">{saison} {annee}</span>
                    <button type="button" className="btn btn-link btn-sm text-danger p-0 m-0" style={{lineHeight: 1, textDecoration: "none"}} onClick={clearAll} title="Réinitialiser la session">⟲</button>
                </div>
            </th>
            <td colSpan={visibleEnseignants.length} style={{backgroundColor: "#e9ecef", borderBottom: "1px solid #dee2e6"}}></td>
        </tr>
        <tr>
            <th style={firstColStyle}>
                <div className="d-flex justify-content-between align-items-center gap-3">
                    <span className="fw-bold">Cours attribués</span>
                    { (chargesManquantes(session) ?? 0) > 0 && <span className="badge bg-danger p-1" style={{fontSize: "0.65rem"}} title={`${chargesManquantes(session)} restants`}>{chargesManquantes(session)}</span> }
                </div>
            </th>
            { visibleEnseignants.map((enseignant: any) => {
                return <ListeCharges key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={enseignantWidth} scenario={scenario} style={cellStyle}/>
            })}
        </tr>
        <tr>
            <th style={firstColStyle}>
                <div className="d-flex justify-content-between align-items-center gap-3">
                    <span className="fw-bold">Libérations</span>
                    { (liberationsManquantes(session) ?? 0) > 0 && <span className="badge bg-warning text-dark p-1" style={{fontSize: "0.65rem"}} title={`${liberationsManquantes(session)} restantes`}>{liberationsManquantes(session)}</span> }
                </div>
            </th>
            { visibleEnseignants.map((enseignant: any) => {
                return <ListeLiberations key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={enseignantWidth} scenario={scenario} style={cellStyle}/>
            })}
        </tr>
        <tr>
            <th style={firstColStyle}>
                <div className="d-flex justify-content-between align-items-center gap-3">
                    <span className="fw-bold">Stagiaires</span>
                    { !isNaN(stagiairesRestants()) && stagiairesRestants() > 0 && <span className="badge bg-info text-dark p-1" style={{fontSize: "0.65rem"}} title={`${stagiairesRestants()} à placer`}>{stagiairesRestants()}</span> }
                </div>
            </th>
            { visibleEnseignants.map((enseignant: any) => {
                const stage = stages?.find(stage => stage.session == session)
                const supervision = supervisions?.find(supervision => supervision.enseignant == enseignant.id && supervision.stage == stage?.id)
                const value = supervision ? supervision.nbStagiaires : 0
                return stage 
                    ?<td key={enseignant.id} className="text-center" style={cellStyle}>
                        <div className="input-group input-group-sm mx-auto" style={{maxWidth: "70px"}}>
                            <input className="form-control text-center p-0" type="number" min="0" step="1" value={value} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={stagiairesHandler} style={{fontSize: "0.8rem"}}/>
                            <span className="input-group-text p-1" style={{fontSize: "0.7rem"}}>/{stage.nbStagiaires}</span>
                        </div>
                    </td>
                    :<td key={enseignant.id} className="text-muted text-center extra-small" style={{...cellStyle, fontSize: "0.75rem"}}>--</td>
            })}
        </tr>
        <tr>
            <th style={ciHeaderStyle}>CI {saison}</th>
            { visibleEnseignants.map((enseignant: any) => {
                return <CI key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={enseignantWidth} trigger={{charges, liberations, groupes}} scenario={scenario} style={cellStyle} bottom={ciBottom} top={ciTop}/>
            })}
        </tr>
    </>
}
