'use client'

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useAuth } from "../../utilities/auth"
import { firestore } from "../../utilities/firebase"
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore"
import { toast } from "react-hot-toast"
import Skeleton from "@/app/utilities/Skeleton";


const COLLECTIONS = [
    "enseignants",
    "cours",
    "groupes",
    "allocations",
    "liberations",
    "stages",
    "supervisions",
    "charges",
    "CIReelles",
    "scenarios"
]

export default function(){
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const ref = useRef<HTMLInputElement>(null)
    const [importing, setImporting] = useState(false)
    const [progress, setProgress] = useState("")
    const [fileSelected, setFileSelected] = useState(false)

    if (authLoading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )
    if (!user) {
        router.push("/login")
        return null
    }

    function handleFileChange() {
        setFileSelected(!!ref.current?.files?.[0])
    }

    async function upload(){
        try {
            const file = ref.current?.files?.[0]
            if (!file) {
                toast.error("Veuillez sélectionner un fichier")
                return
            }

            if (!confirm("ATTENTION : Cette opération supprimera VOS données actuelles pour les remplacer par le contenu du fichier. Continuer ?")) {
                return
            }

            setImporting(true)
            setProgress("Lecture du fichier...")
            
            const fileTextContent = await file.text()
            const fileContent = JSON.parse(fileTextContent)

            if (typeof fileContent !== 'object' || fileContent === null || Array.isArray(fileContent)) {
                throw new Error("Format de fichier invalide : le contenu doit être un objet.")
            }

            // Map to store oldId -> newId for relational integrity
            const idMap: Record<string, Record<string, string>> = {}
            for (const coll of COLLECTIONS) idMap[coll] = {}

            // Validation and Import
            for (const collectionName of COLLECTIONS) {
                setProgress(`Traitement de la collection : ${collectionName}...`)
                
                // 1. Clear existing data FOR THIS USER ONLY
                const q = query(collection(firestore, collectionName), where("userId", "==", user!.uid))
                const snapshot = await getDocs(q)
                const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref))
                await Promise.all(deletePromises)

                // 2. Import new data and tag with current userId
                const dataToImport = fileContent[collectionName]
                if (dataToImport && Array.isArray(dataToImport)) {
                    const importPromises = dataToImport.map(async (item: any) => {
                        const { id: oldId, userId, ...data } = item
                        
                        // Update references based on previous mappings
                        const dataWithReferences = { ...data }
                        
                        if (collectionName === "groupes" && data.cours) {
                            dataWithReferences.cours = idMap["cours"][data.cours] || data.cours
                        }
                        if (collectionName === "allocations" && data.session) {
                            // session is usually a string code like "A24", not a ref
                        }
                        if (collectionName === "liberations") {
                            if (data.enseignant) dataWithReferences.enseignant = idMap["enseignants"][data.enseignant] || data.enseignant
                            if (data.allocation) dataWithReferences.allocation = idMap["allocations"][data.allocation] || data.allocation
                            if (data.scenario && data.scenario !== "production") dataWithReferences.scenario = idMap["scenarios"][data.scenario] || data.scenario
                        }
                        if (collectionName === "supervisions") {
                            if (data.enseignant) dataWithReferences.enseignant = idMap["enseignants"][data.enseignant] || data.enseignant
                            if (data.stage) dataWithReferences.stage = idMap["stages"][data.stage] || data.stage
                            if (data.scenario && data.scenario !== "production") dataWithReferences.scenario = idMap["scenarios"][data.scenario] || data.scenario
                        }
                        if (collectionName === "charges") {
                            if (data.enseignant) dataWithReferences.enseignant = idMap["enseignants"][data.enseignant] || data.enseignant
                            if (data.groupe) dataWithReferences.groupe = idMap["groupes"][data.groupe] || data.groupe
                            if (data.scenario && data.scenario !== "production") dataWithReferences.scenario = idMap["scenarios"][data.scenario] || data.scenario
                        }
                        if (collectionName === "CIReelles") {
                            if (data.enseignant) dataWithReferences.enseignant = idMap["enseignants"][data.enseignant] || data.enseignant
                        }

                        const dataWithUser = { ...dataWithReferences, userId: user!.uid }
                        
                        const newDocRef = doc(collection(firestore, collectionName))
                        await setDoc(newDocRef, dataWithUser)
                        
                        if (oldId) {
                            idMap[collectionName][oldId] = newDocRef.id
                        }
                    })
                    await Promise.all(importPromises)
                }
            }

            toast.success("Données importées avec succès !")
            router.push("/db")
        } catch (error: any) {
            console.error("Import error:", error)
            toast.error("Erreur lors de l'importation : " + (error instanceof Error ? error.message : "Erreur inconnue"))
        } finally {
            setImporting(false)
            setProgress("")
        }
    }

    return <div className="container mt-3">
        
        <div className="card shadow-sm mx-auto" style={{maxWidth: "600px"}}>
            <div className="card-header bg-primary text-white">
                <h4 className="mb-0">📥 Importer des données</h4>
            </div>
            <div className="card-body py-5 px-4">
                <div className="alert alert-warning mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Attention :</strong> L'importation remplace l'intégralité des données existantes dans Firestore par celles du fichier.
                </div>
                
                <div className="mb-4">
                    <label htmlFor="fileInput" className="form-label text-muted small">Sélectionnez un fichier .json de sauvegarde</label>
                    <input 
                        type="file" 
                        className="form-control form-control-lg" 
                        id="fileInput" 
                        ref={ref}
                        disabled={importing}
                        accept=".json"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="text-center">
                    <button 
                        className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm w-100" 
                        onClick={upload}
                        disabled={importing || !fileSelected}
                    >
                        {importing ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Importation...
                            </>
                        ) : (
                            "🚀 Lancer l'importation"
                        )}
                    </button>
                    {progress && <p className="mt-3 text-info small animate-pulse">{progress}</p>}
                </div>
            </div>
        </div>
    </div>
}