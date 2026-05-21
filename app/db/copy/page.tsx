'use client'

import SelectSession from "@/app/admin/components/inputs/SelectSession";
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../utilities/auth"
import { firestore } from "../../utilities/firebase"
import { collection, getDocs, addDoc, doc, deleteDoc, query, where } from "firebase/firestore"
import { toast } from "react-hot-toast"

export default function(){
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    
    const [sessionDepart, setSessionDepart] = useState("A25")
    const [annee, setAnnee] = useState(2026)
    const [copying, setCopying] = useState(false)
    const [progress, setProgress] = useState("")

    if (authLoading) return <div className="container mt-5 text-center">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    async function copy(){
        try {
            const sessionArrivee = makeSessionCode(extractSessionInfos(sessionDepart).saison, String(annee))

            if(sessionDepart == sessionArrivee){
                toast.error("Les deux sessions doivent être différentes")
                return
            }

            if (!confirm(`Voulez-vous copier les données de ${sessionDepart} vers ${sessionArrivee} ? Les données existantes de ${sessionArrivee} seront supprimées.`)) {
                return
            }

            setCopying(true)
            setProgress("Chargement des données sources...")

            // 1. Fetch source data FOR THIS USER ONLY
            const fetchCollection = async (name: string) => {
                const q = query(collection(firestore, name), where("userId", "==", user!.uid))
                const snap = await getDocs(q)
                return snap.docs.map(d => ({id: d.id, ...d.data()}))
            }

            const allGroupes = await fetchCollection("groupes")
            const allAllocations = await fetchCollection("allocations")
            const allStages = await fetchCollection("stages")
            const allCharges = await fetchCollection("charges")
            const allLiberations = await fetchCollection("liberations")
            const allSupervisions = await fetchCollection("supervisions")

            setProgress(`Suppression des données existantes de ${sessionArrivee}...`)

            // 2. Clear target session (ONLY FOR THIS USER)
            const groupesArrivee = allGroupes.filter((g: any) => g.session === sessionArrivee)
            for (const g of groupesArrivee) {
                const chargesArrivee = allCharges.filter((c: any) => String(c.groupe) === String(g.id))
                for (const c of chargesArrivee) await deleteDoc(doc(firestore, "charges", c.id))
                await deleteDoc(doc(firestore, "groupes", g.id))
            }

            const allocationsArrivee = allAllocations.filter((a: any) => a.session === sessionArrivee)
            for (const a of allocationsArrivee) {
                const liberationsArrivee = allLiberations.filter((l: any) => String(l.allocation) === String(a.id))
                for (const l of liberationsArrivee) await deleteDoc(doc(firestore, "liberations", l.id))
                await deleteDoc(doc(firestore, "allocations", a.id))
            }

            const stagesArrivee = allStages.filter((s: any) => s.session === sessionArrivee)
            for (const s of stagesArrivee) {
                const supervisionsArrivee = allSupervisions.filter((sup: any) => String(sup.stage) === String(s.id))
                for (const sup of supervisionsArrivee) await deleteDoc(doc(firestore, "supervisions", sup.id))
                await deleteDoc(doc(firestore, "stages", s.id))
            }

            setProgress(`Copie vers ${sessionArrivee}...`)

            // 3. Perform Copy (AND TAG WITH userId)
            // Groupes & Charges
            const groupesSource = allGroupes.filter((g: any) => g.session === sessionDepart)
            for (const g of groupesSource) {
                const { id: oldId, ...data } = g as any
                const newRef = await addDoc(collection(firestore, "groupes"), { ...data, session: sessionArrivee, userId: user!.uid })
                const chargesSource = allCharges.filter((c: any) => String(c.groupe) === String(oldId))
                for (const c of chargesSource) {
                    const { id: _, ...cData } = c as any
                    await addDoc(collection(firestore, "charges"), { ...cData, groupe: newRef.id, userId: user!.uid })
                }
            }

            // Allocations & Liberations
            const allocationsSource = allAllocations.filter((a: any) => a.session === sessionDepart)
            for (const a of allocationsSource) {
                const { id: oldId, ...data } = a as any
                const newRef = await addDoc(collection(firestore, "allocations"), { ...data, session: sessionArrivee, userId: user!.uid })
                const liberationsSource = allLiberations.filter((l: any) => String(l.allocation) === String(oldId))
                for (const l of liberationsSource) {
                    const { id: _, ...lData } = l as any
                    await addDoc(collection(firestore, "liberations"), { ...lData, allocation: newRef.id, userId: user!.uid })
                }
            }

            // Stages & Supervisions
            const stagesSource = allStages.filter((s: any) => s.session === sessionDepart)
            for (const s of stagesSource) {
                const { id: oldId, ...data } = s as any
                const newRef = await addDoc(collection(firestore, "stages"), { ...data, session: sessionArrivee, userId: user!.uid })
                const supervisionsSource = allSupervisions.filter((sup: any) => String(sup.stage) === String(oldId))
                for (const sup of supervisionsSource) {
                    const { id: _, ...supData } = sup as any
                    await addDoc(collection(firestore, "supervisions"), { ...supData, stage: newRef.id, userId: user!.uid })
                }
            }

            toast.success("Copie effectuée avec succès !")
            router.push("/db")
        } catch (error) {
            console.error("Copy error:", error)
            toast.error("Erreur lors de la copie")
        } finally {
            setCopying(false)
            setProgress("")
        }
    }

    return <div className="container mt-3">
        
        <div className="card shadow-sm mx-auto" style={{maxWidth: "600px"}}>
            <div className="card-header bg-info text-white">
                <h4 className="mb-0">👯 Copier une session</h4>
            </div>
            <div className="card-body py-4 px-4">
                <div className="mb-4">
                    <label className="form-label text-muted small">Session source (à copier) :</label>
                    <SelectSession code={sessionDepart} onChange={setSessionDepart} />
                </div>
                
                <div className="mb-4">
                    <label className="form-label text-muted small">Année de destination :</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light">Année</span>
                        <input 
                            type="number" 
                            className="form-control"
                            min="2000" 
                            value={annee} 
                            onChange={(ev) => setAnnee(Number(ev.target.value))} 
                        />
                    </div>
                    <small className="text-muted mt-1 d-block">La saison (Automne/Hiver) sera la même que la source.</small>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                    <button 
                        className="btn btn-info text-white btn-lg px-5 rounded-pill shadow-sm w-100" 
                        onClick={copy}
                        disabled={copying}
                    >
                        {copying ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Copie en cours...
                            </>
                        ) : (
                            "🔄 Lancer la copie"
                        )}
                    </button>
                    {progress && <p className="mt-3 text-info small animate-pulse">{progress}</p>}
                </div>
            </div>
        </div>
    </div>
}