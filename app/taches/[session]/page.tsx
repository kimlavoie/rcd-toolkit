'use client'
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import { useState, useRef } from "react"
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import Enseignant from "./components/Enseignant"
import Tache from "./components/Tache"
import Summary from "./components/Summary"
import CIReelle from "./components/CIReelle"
import Link from "next/link"
import { useAuth } from "@/app/utilities/auth"
import type { Enseignant as EnseignantType } from "@/app/db/db"

export default function(){
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const session = params.session as string
    
    // Safety check for session code format (should be like A26 or H26)
    const isValidSession = session && /^[AH]\d{2}$/.test(session);
    
    const sessionInfos = isValidSession ? extractSessionInfos(session) : { saison: "Inconnue", annee: "" };
    const {saison, annee} = sessionInfos;

    // To calculate CI Annuelle, we need the other session of the same academic year
    // A24 -> sessions = [A24, H25]
    // H25 -> sessions = [A24, H25]
    const currentYearShort = parseInt(session.substring(1));
    const sessionsAnnuelle = saison === "Automne" 
        ? [session, `H${(currentYearShort + 1).toString().padStart(2, '0')}`]
        : [`A${(currentYearShort - 1).toString().padStart(2, '0')}`, session];

    const [cache, setCache] = useState<any[]>([])
    const [tri, setTri] = useState("nom")
    const [showOptions, setShowOptions] = useState(false)

    const enseignants = useFirestoreCollection<EnseignantType>("enseignants")
    const groupes = useFirestoreCollection<any>("groupes")
    const charges = useFirestoreCollection<any>("charges")
    const allocations = useFirestoreCollection<any>("allocations")
    const liberations = useFirestoreCollection<any>("liberations")
    const stages = useFirestoreCollection<any>("stages")
    const supervisions = useFirestoreCollection<any>("supervisions")
    const cours = useFirestoreCollection<any>("cours")

    const [firstColWidth, setFirstColWidth] = useState(250)
    const isResizing = useRef(false)

    const startResizing = (e: React.MouseEvent) => {
        isResizing.current = true
        const startX = e.pageX
        const startWidth = firstColWidth
        
        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return
            const newWidth = startWidth + (moveEvent.pageX - startX)
            setFirstColWidth(newWidth > 150 ? newWidth : 150)
        }
        
        const onMouseUp = () => {
            isResizing.current = false
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }
        
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }

    if (authLoading) return <div className="container mt-5">Chargement...</div>

    if (!user) {
        router.push("/login")
        return null
    }

    if (!isValidSession) {
        return <div className="container mt-5 alert alert-danger">Code de session invalide: {session}</div>
    }

    const valider = async () => {
        if (!groupes || !charges || !allocations || !liberations || !stages || !supervisions || !cours) {
            alert("Données en cours de chargement...")
            return
        }

        const reports: string[] = []

        sessionsAnnuelle.forEach(sCode => {
            const sessionReports = []
            const { saison: sSaison, annee: sAnnee } = extractSessionInfos(sCode)
            const sessionLabel = `${sSaison} ${sAnnee}`

            // 1. Cours restants (groupes non complets - 15 semaines)
            const groupesSession = groupes.filter(g => g.session === sCode)
            const groupesIncomplets = groupesSession.map(g => {
                const chargesDuGroupe = charges.filter(c => String(c.groupe) === String(g.id))
                const totalSemaines = chargesDuGroupe.reduce((sum, c) => sum + Number(c.nbSemaines || 0), 0)
                return { group: g, restant: 15 - totalSemaines }
            }).filter(r => r.restant > 0.001)
            
            if (groupesIncomplets.length > 0) {
                sessionReports.push("Cours non complétés (moins de 15 sem.) :\n" + groupesIncomplets.map(r => {
                    const c = cours.find(c => String(c.id) === String(r.group.cours))
                    return `- ${c?.sigle ?? 'Inconnu'} (Gr. ${r.group.id.substring(0,4)}) : ${r.restant.toFixed(1)} sem. restantes`
                }).join("\n"))
            }

            // 2. Libérations restantes
            const allocationsSession = allocations.filter(a => a.session === sCode)
            const libRestantes = allocationsSession.map(a => {
                const totalLibere = liberations.filter(l => String(l.allocation) === String(a.id)).reduce((sum, l) => sum + Number(l.quantite), 0)
                return { desc: a.description || a.code, restant: Number(a.quantite) - totalLibere }
            }).filter(r => r.restant > 0.001)

            if (libRestantes.length > 0) {
                sessionReports.push("Libérations restantes :\n" + libRestantes.map(r => `- ${r.desc} : ${r.restant.toFixed(3)}`).join("\n"))
            }

            // 3. Stagiaires à placer
            const stagesSession = stages.filter(s => s.session === sCode)
            const stagRestants = stagesSession.map(s => {
                const totalPlaces = supervisions.filter(sup => String(sup.stage) === String(s.id)).reduce((sum, sup) => sum + Number(sup.nbStagiaires), 0)
                return { id: s.id, restant: Number(s.nbStagiaires) - totalPlaces }
            }).filter(r => r.restant > 0.001)

            if (stagRestants.length > 0) {
                sessionReports.push("Stagiaires à placer :\n" + stagRestants.map(r => `- Stage ${r.id.substring(0,4)} : ${r.restant} stagiaire(s) restant(s)`).join("\n"))
            }

            if (sessionReports.length > 0) {
                reports.push(`### Session ${sessionLabel} ###\n` + sessionReports.join("\n\n"))
            }
        })

        if (reports.length === 0) {
            alert("Toutes les tâches sont validées pour toutes les sessions affichées ! Tout est en ordre.")
        } else {
            alert("Rapport de validation :\n\n" + reports.join("\n\n---\n\n"))
        }
    }

    return <div className="container-fluid mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push("/taches")}>← Retour</button>  
        <div className="card shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h1 className="mb-0 text-primary">
                    {saison === "Automne" ? `Année scolaire ${annee}-${parseInt(annee)+1}` : `${saison} ${annee}`}
                </h1>
                <button className="btn btn-success rounded-pill shadow-sm" onClick={valider}>
                    ✅ Valider les tâches
                </button>
            </div>
            
            <div className="mb-4">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <h5 className="mb-0 text-muted small uppercase">Affichage</h5>
                    <button 
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3" 
                        onClick={() => setShowOptions(!showOptions)}
                        style={{fontSize: "0.75rem"}}
                    >
                        {showOptions ? "Cacher les options ↑" : "Options d'affichage ⚙️"}
                    </button>
                </div>
                
                {showOptions && (
                    <div className="card bg-light border-0 p-3 animate-fade-in">
                        <div className="d-flex gap-4 align-items-center flex-wrap">
                            <div>
                                <label className="form-label small text-muted mb-1">Trier les enseignants :</label>
                                <select className="form-select form-select-sm" value={tri} onChange={ev => setTri(ev.target.value)} style={{width: "200px"}}>
                                    <option value="nom">Nom</option>
                                    <option value="numeroEmploye">No d'employé</option>
                                </select>
                            </div>
                            <div className="flex-grow-1">
                                <label className="form-label small text-muted mb-1">Visibilité :</label>
                                <div className="d-flex gap-2 flex-wrap align-items-center">
                                    {enseignants && enseignants.length != cache.length && (
                                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setCache(enseignants.map(enseignant => enseignant.id))}>Tout cacher</button>
                                    )}
                                    <button className="btn btn-outline-primary btn-sm" onClick={() => setCache([])}>Tout afficher</button>
                                    
                                    {cache.length > 0 && (
                                        <div className="ms-3 d-flex gap-2 flex-wrap align-items-center">
                                            <span className="small text-muted me-1">Réafficher :</span>
                                            {(enseignants ?? [])
                                                .filter(e => cache.includes(e.id))
                                                .toSorted((a, b) => (a.nom ?? "").localeCompare(b.nom ?? ""))
                                                .map(e => (
                                                    <button 
                                                        key={e.id} 
                                                        className="btn btn-xs btn-outline-info rounded-pill py-0 px-2" 
                                                        style={{fontSize: "0.7rem"}}
                                                        onClick={() => setCache(cache.filter(id => id !== e.id))}
                                                    >
                                                        {e.prenom?.[0]}. {e.nom} ✕
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="table-responsive" style={{maxHeight: "75vh"}}>
                <table className="table table-bordered table-hover align-middle mb-0">
                    <thead className="table-light sticky-top" style={{zIndex: 105}}>
                        <tr>
                            <th 
                                className="bg-light" 
                                style={{
                                    position: "sticky", 
                                    left: 0, 
                                    zIndex: 106, 
                                    minWidth: `${firstColWidth}px`,
                                    width: `${firstColWidth}px`
                                }}
                            >
                                Actions / Enseignants
                                <div 
                                    onMouseDown={startResizing}
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '5px',
                                        cursor: 'col-resize',
                                        zIndex: 1
                                    }}
                                />
                            </th>
                            {(enseignants ?? [])
                            .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))
                            .filter(enseignant => !cache.includes(enseignant.id))
                            .map(enseignant => (
                                <Enseignant key={enseignant.id} enseignant={enseignant} onCache={() => setCache([...cache, enseignant.id])}/>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {saison === "Automne" ? (
                            <>
                                <Tache session={sessionsAnnuelle[0]} cache={cache} tri={tri} firstColWidth={firstColWidth}/>
                                <Tache session={sessionsAnnuelle[1]} cache={cache} tri={tri} firstColWidth={firstColWidth}/>
                            </>
                        ) : (
                            <>
                                <CIReelle session={sessionsAnnuelle[0]} cache={cache} tri={tri} firstColWidth={firstColWidth}/>
                                <Tache session={sessionsAnnuelle[1]} cache={cache} tri={tri} firstColWidth={firstColWidth}/>
                            </>
                        )}
                        <Summary session={session} sessions={sessionsAnnuelle} cache={cache} tri={tri} saison={saison} firstColWidth={firstColWidth}/>
                    </tbody>
                </table>
            </div>


        </div>
    </div>
}
