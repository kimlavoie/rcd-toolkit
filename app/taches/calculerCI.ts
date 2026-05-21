import calculateur from "@/app/calculateur/calculateur"
import { collection, getDocs } from "firebase/firestore"
import { firestore } from "../../utilities/firebase"

export default async function calculerCI(session: string, enseignant: any){
    // In Firestore, we need to fetch the data
    const chargesSnap = await getDocs(collection(firestore, "charges"))
    const charges = chargesSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

    const liberationsSnap = await getDocs(collection(firestore, "liberations"))
    const liberations = liberationsSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

    const groupesSnap = await getDocs(collection(firestore, "groupes"))
    const groupes = groupesSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

    const coursSnap = await getDocs(collection(firestore, "cours"))
    const cours = coursSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

    const allocationsSnap = await getDocs(collection(firestore, "allocations"))
    const allocations = allocationsSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

    const supervisionsSnap = await getDocs(collection(firestore, "supervisions"))
    const supervisions = supervisionsSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

    const stagesSnap = await getDocs(collection(firestore, "stages"))
    const stages = stagesSnap.docs.map(doc => ({id: doc.id, ...doc.data()})) as any[]

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
