import calculateur from "@/app/calculateur/calculateur"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Enseignant, Liberation, Allocation, Groupe, Charge, Cours, Supervision, Stage, CIReelle } from "@/app/db/db"

export default function({visibleEnseignants, sessions, saison, firstColWidth, enseignantWidth, scenario = "production"}:any){
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const allLiberations = useFirestoreCollection<Liberation>("liberations")
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const allCharges = useFirestoreCollection<Charge>("charges")
    const cours = useFirestoreCollection<Cours>("cours")
    const allSupervisions = useFirestoreCollection<Supervision>("supervisions")
    const stages = useFirestoreCollection<Stage>("stages")
    const CIReelles = useFirestoreCollection<CIReelle>("CIReelles")

    // Safety check for sessions array
    if (!sessions || sessions.length < 2) {
        return null;
    }

    // Filter by scenario
    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario)
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario)
    const supervisions = allSupervisions?.filter(s => (s.scenario || "production") === scenario)

    const firstColStyle = {
        position: "sticky" as const, 
        left: 0, 
        zIndex: 101,
        backgroundColor: "#212529",
        boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
        borderRight: "2px solid #444",
        padding: "4px 12px",
        fontSize: "0.8rem",
        whiteSpace: "nowrap" as const,
        width: "1px",
        backgroundClip: "padding-box"
    }

    return <>
                <tr className="table-dark">
                    <th style={firstColStyle} className="fw-bold">CI Annuelle (Total)</th>
                    { visibleEnseignants.map((enseignant: any) => {
                        const enseignantId = String(enseignant.id);

                        // Helper to calculate CI for a specific session
                        const getSessionCI = (sessionCode: string) => {
                            const chargesEnseignant = (charges ?? []).filter(charge => String(charge.enseignant) === enseignantId)
                            const groupesSession = (groupes ?? []).filter(groupe => groupe.session === sessionCode)
                            const chargesSession = chargesEnseignant.filter(charge => groupesSession.find(groupe => groupe.id === charge.groupe))
                            
                            const chargesInfos = chargesSession.map(charge => {
                                const groupe = (groupes ?? []).find(groupe => groupe.id === charge.groupe)
                                const cour = (cours ?? []).find(cour => String(groupe?.cours) === String(cour.id))
                                return {
                                    sigle: cour?.sigle ?? "", 
                                    etudiants: Number(groupe?.nbEtudiants ?? 0), 
                                    heures: Number(cour?.heuresTheorie ?? 0) + Number(cour?.heuresPratique ?? 0), 
                                    semaines: Number(charge.nbSemaines ?? 0)
                                }
                            })

                            const liberationsEnseignant = (liberations ?? []).filter(liberation => String(liberation.enseignant) === enseignantId)
                            const allocationsSession = (allocations ?? []).filter(allocation => allocation.session === sessionCode)
                            const liberationsSession = liberationsEnseignant.filter(liberation => allocationsSession.find(allocation => allocation.id === liberation.allocation))
                            const liberationsInfos = liberationsSession.map(liberation => ({ qte: Number(liberation.quantite ?? 0) }))

                            const supervisionsEnseignant = (supervisions ?? []).filter(supervision => String(supervision.enseignant) === enseignantId)
                            const stagesSession = (stages ?? []).filter(stage => stage.session === sessionCode)
                            const supervisionsSession = supervisionsEnseignant.find(supervision => stagesSession.find(stage => stage.id === supervision.stage))
                            
                            const stagiaires = Number(supervisionsSession?.nbStagiaires ?? 0)
                            const ETCparStagiaire = Number(stagesSession?.[0]?.ETCparStagiaire ?? 0)
                            
                            return calculateur(chargesInfos, liberationsInfos, stagiaires, ETCparStagiaire).total;
                        };

                        const CIReelleExistante = (CIReelles ?? []).find(ci => String(ci.enseignant) === enseignantId && ci.session === sessions[0]);

                        const CIA = saison === "Hiver" ? CIReelleExistante?.CI ?? 0 : getSessionCI(sessions[0]);
                        const CIH = getSessionCI(sessions[1]);
                        const CI = CIA + CIH;
                        
                        const couleur = CI < 70 ? "inherit" : CI < 80 ? "darkkhaki" : CI < 85 ? "green" : "red"
                        
                        return <td key={enseignant.id} style={{color: couleur, fontWeight: "bold", backgroundColor: "#212529", textAlign: "center", minWidth: `${enseignantWidth}px`, width: `${enseignantWidth}px`, fontSize: "0.9rem"}}>
                            {CI.toFixed(2)}
                        </td>
                    })}
                </tr>
    </>
}
