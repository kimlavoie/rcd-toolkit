'use client'

import { useRouter } from "next/navigation"
import { useAuth } from "../../utilities/auth"
import { firestore } from "../../utilities/firebase"
import { collection, getDocs } from "firebase/firestore"
import { useState } from "react"
import { toast } from "react-hot-toast"

const COLLECTIONS = [
    "enseignants",
    "cours",
    "groupes",
    "allocations",
    "liberations",
    "stages",
    "supervisions",
    "charges",
    "CIReelles"
]

export default function(){    
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [exporting, setExporting] = useState(false)

    if (authLoading) return <div className="container mt-5 text-center">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    async function download(){
        try {
            setExporting(true)
            const allData: any = {};
            
            for (const collectionName of COLLECTIONS) {
                const snapshot = await getDocs(collection(firestore, collectionName))
                allData[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
            }

            const datetime = new Date().toISOString().split('.')[0].replace(/:/g, '-')
            const json = JSON.stringify(allData, null, 2)
            const blob = new Blob([json], {type: 'application/json'})
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `backup-rcd-${datetime}.json`
            link.click()

            URL.revokeObjectURL(url)
            toast.success("Exportation réussie !")
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Erreur lors de l'exportation")
        } finally {
            setExporting(false)
        }
    }

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push("/db")}>← Retour</button>
        
        <div className="card shadow-sm mx-auto" style={{maxWidth: "600px"}}>
            <div className="card-header bg-success text-white">
                <h4 className="mb-0">📤 Exporter les données</h4>
            </div>
            <div className="card-body text-center py-5">
                <p className="lead text-muted mb-4">
                    Générez une sauvegarde complète de votre base de données au format JSON.
                </p>
                <button 
                    className="btn btn-success btn-lg px-5 rounded-pill shadow-sm" 
                    onClick={download}
                    disabled={exporting}
                >
                    {exporting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Exportation en cours...
                        </>
                    ) : (
                        "🚀 Télécharger le Backup"
                    )}
                </button>
                <div className="mt-4 small text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Le fichier contiendra toutes les collections (enseignants, cours, charges, etc.)
                </div>
            </div>
        </div>
    </div>
}