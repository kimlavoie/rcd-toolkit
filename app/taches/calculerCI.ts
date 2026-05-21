import { calculateSessionCI } from "@/app/utilities/ciHelpers"
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

    return calculateSessionCI(enseignant.id, session, {
        charges, liberations, supervisions, groupes, cours, stages, allocations
    } as any);
}
