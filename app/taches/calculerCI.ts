import calculateur from "@/app/calculateur/calculateur"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore, auth } from "../utilities/firebase"

export default async function calculerCI(session: string, enseignant: any){
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User must be logged in to calculate CI");

    // Helper to fetch filtered collection
    const fetchFiltered = async (collectionName: string) => {
        const q = query(collection(firestore, collectionName), where("userId", "==", userId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[];
    };

    const charges = await fetchFiltered("charges");
    const liberations = await fetchFiltered("liberations");
    const groupes = await fetchFiltered("groupes");
    const cours = await fetchFiltered("cours");
    const allocations = await fetchFiltered("allocations");
    const supervisions = await fetchFiltered("supervisions");
    const stages = await fetchFiltered("stages");

    const enseignantId = String(enseignant.id);

    const chargesEnseignant = charges.filter(charge => String(charge.enseignant) === enseignantId)
    const groupesSession = groupes.filter(groupe => groupe.session === session)
    const chargesSession = chargesEnseignant.filter(charge => groupesSession.find(groupe => groupe.id === charge.groupe))
    
    const chargesInfos = chargesSession.map(charge => {
        const groupe = groupes.find(groupe => groupe.id === charge.groupe)
        const cour = cours.find(cour => String(groupe?.cours) === String(cour.id))
        return {
            sigle: cour?.sigle ?? "", 
            etudiants: Number(groupe?.nbEtudiants ?? 0), 
            heures: Number(cour?.heuresTheorie ?? 0) + Number(cour?.heuresPratique ?? 0), 
            semaines: Number(charge.nbSemaines ?? 0)
        }
    })

    const liberationsEnseignant = liberations.filter(liberation => String(liberation.enseignant) === enseignantId)
    const allocationsSession = allocations.filter(allocation => allocation.session === session)
    const liberationsSession = liberationsEnseignant.filter(liberation => allocationsSession.find(allocation => allocation.id === liberation.allocation))
    
    const liberationsInfos = liberationsSession.map(liberation => {
        return { qte: Number(liberation.quantite ?? 0) }
    })

    const supervisionsEnseignant = supervisions.filter(supervision => String(supervision.enseignant) === enseignantId)
    const stagesSession = stages.filter(stage => stage.session === session)
    const supervisionsSession = supervisionsEnseignant.find(supervision => stagesSession.find(stage => stage.id === supervision.stage))
    
    const stagiaires = Number(supervisionsSession?.nbStagiaires ?? 0)
    const ETCparStagiaire = Number(stagesSession?.[0]?.ETCparStagiaire ?? 0)
    
    const result = calculateur(chargesInfos, liberationsInfos, stagiaires, ETCparStagiaire);
    return result.total;
}
