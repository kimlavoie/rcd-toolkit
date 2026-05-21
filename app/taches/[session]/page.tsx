'use client'
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import { useState, useRef, useEffect } from "react"
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import Enseignant from "./components/Enseignant"
import Tache from "./components/Tache"
import Summary from "./components/Summary"
import CIReelle from "./components/CIReelle"
import Link from "next/link"
import { useAuth } from "@/app/utilities/auth"
import type { Enseignant as EnseignantType, Scenario } from "@/app/db/db"
import { toast } from "react-hot-toast"

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
    const [search, setSearch] = useState("")
    const [tri, setTri] = useState("nom")
    const [showHelp, setShowHelp] = useState(false)
    const [enseignantWidth, setEnseignantWidth] = useState(200)
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>("production")

    const enseignants = useFirestoreCollection<EnseignantType>("enseignants")
    const groupes = useFirestoreCollection<any>("groupes")
    const charges = useFirestoreCollection<any>("charges")
    const allocations = useFirestoreCollection<any>("allocations")
    const liberations = useFirestoreCollection<any>("liberations")
    const stages = useFirestoreCollection<any>("stages")
    const supervisions = useFirestoreCollection<any>("supervisions")
    const cours = useFirestoreCollection<any>("cours")
    const scenarios = useFirestoreCollection<Scenario>("scenarios")

    const currentSessionScenarios = scenarios?.filter(s => s.session === session) || []

    useEffect(() => {
        if (currentSessionScenarios.length > 0 && selectedScenarioId === "production") {
            const defaultScenario = currentSessionScenarios.find(s => s.isDefault)
            if (defaultScenario) {
                setSelectedScenarioId(defaultScenario.id)
            }
        }
    }, [scenarios, session])

    // Filter and Sort Enseignants
    const visibleEnseignants = (enseignants ?? [])
        .filter(e => !cache.includes(e.id))
        .filter(e => {
            if (!search) return true
            const searchLower = search.toLowerCase()
            return (
                (e.nom ?? "").toLowerCase().includes(searchLower) || 
                (e.prenom ?? "").toLowerCase().includes(searchLower) ||
                (e.numeroEmploye ?? "").toLowerCase().includes(searchLower)
            )
        })
        .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))

    if (authLoading) return <div className="container mt-5 text-center">Chargement...</div>

    if (!user) {
        router.push("/login")
        return null
    }

    if (!isValidSession) {
        return <div className="container mt-5 alert alert-danger">Code de session invalide: {session}</div>
    }

    const valider = async () => {
        if (!groupes || !charges || !allocations || !liberations || !stages || !supervisions || !cours) {
            toast.error("Données en cours de chargement...")
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
                const chargesDuGroupe = charges.filter(c => String(c.groupe) === String(g.id) && (c.scenario || "production") === selectedScenarioId)
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
                const totalLibere = liberations.filter(l => String(l.allocation) === String(a.id) && (l.scenario || "production") === selectedScenarioId).reduce((sum, l) => sum + Number(l.quantite), 0)
                return { desc: a.description || a.code, restant: Number(a.quantite) - totalLibere }
            }).filter(r => r.restant > 0.001)

            if (libRestantes.length > 0) {
                sessionReports.push("Libérations restantes :\n" + libRestantes.map(r => `- ${r.desc} : ${r.restant.toFixed(3)}`).join("\n"))
            }

            // 3. Stagiaires à placer
            const stagesSession = stages.filter(s => s.session === sCode)
            const stagRestants = stagesSession.map(s => {
                const totalPlaces = supervisions.filter(sup => String(sup.stage) === String(s.id) && (sup.scenario || "production") === selectedScenarioId).reduce((sum, sup) => sum + Number(sup.nbStagiaires), 0)
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
            toast.success("Toutes les tâches sont validées pour toutes les sessions affichées ! Tout est en ordre.")
        } else {
            toast("Rapport de validation :\n\n" + reports.join("\n\n---\n\n"))
        }
    }

    return <div className="d-flex flex-column bg-light" style={{ position: "absolute", top: "50px", left: 0, right: 0, bottom: 0, overflow: "hidden", padding: "0.5rem" }}>
        <div className="card shadow-sm p-2 flex-grow-1 d-flex flex-column overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2 px-2">
                <h1 className="mb-0 text-primary h5 fw-bold">
                    {saison === "Automne" ? `Année scolaire ${annee}-${parseInt(annee)+1}` : `${saison} ${annee}`}
                </h1>
                {selectedScenarioId !== "production" && (
                    <span className="badge bg-warning text-dark animate-pulse" style={{fontSize: "0.7rem"}}>
                        Mode Scénario : {currentSessionScenarios.find(s => s.id === selectedScenarioId)?.nom}
                    </span>
                )}
            </div>
            
            <div className="mb-2 px-2">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                    {/* Recherche */}
                    <div className="input-group input-group-sm shadow-sm" style={{maxWidth: "180px"}}>
                        <span className="input-group-text bg-white border-end-0 text-muted py-0">🔍</span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 ps-0 py-0" 
                            placeholder="Chercher..." 
                            value={search} 
                            style={{fontSize: "0.8rem", height: "31px"}}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="btn btn-outline-secondary border-start-0 py-0" onClick={() => setSearch("")}>✕</button>
                        )}
                    </div>

                    {/* Scénario */}
                    <div className="d-flex align-items-center gap-1 bg-white px-2 rounded shadow-sm border" style={{height: "31px"}}>
                        <span className="text-muted extra-small fw-bold text-uppercase px-1" style={{fontSize: "0.6rem"}}>Scénario 🎭</span>
                        <select 
                            className="form-select form-select-sm border-0 fw-bold text-primary p-0 ps-1" 
                            style={{width: "auto", minWidth: "120px", outline: "none", boxShadow: "none", backgroundColor: "transparent", fontSize: "0.75rem", paddingRight: "25px"}}
                            value={selectedScenarioId}
                            onChange={e => setSelectedScenarioId(e.target.value)}
                        >
                            <option value="production">🚀 Production</option>
                            {currentSessionScenarios.map(s => (
                                <option key={s.id} value={s.id}>📁 {s.nom}</option>
                            ))}
                        </select>
                        <Link href="/admin/scenarios" className="btn btn-sm btn-link text-muted p-0 ms-1" title="Gérer les scénarios" style={{fontSize: "0.75rem"}}>⚙️</Link>
                    </div>

                    {/* Tri */}
                    <div className="d-flex align-items-center gap-1 bg-white px-2 rounded shadow-sm border" style={{height: "31px"}}>
                        <span className="text-muted extra-small fw-bold text-uppercase px-1" style={{fontSize: "0.6rem"}}>Tri</span>
                        <select className="form-select form-select-sm border-0 p-0 fw-bold" style={{width: "auto", minWidth: "60px", outline: "none", boxShadow: "none", backgroundColor: "transparent", fontSize: "0.75rem", paddingRight: "25px"}} value={tri} onChange={ev => setTri(ev.target.value)}>
                            <option value="nom">Nom</option>
                            <option value="numeroEmploye">No</option>
                        </select>
                    </div>

                    {/* Largeur */}
                    <div className="btn-group btn-group-sm shadow-sm border rounded overflow-hidden" style={{height: "31px"}}>
                        <button className={`btn btn-white py-0 border-0 ${enseignantWidth === 100 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.65rem"}} onClick={() => setEnseignantWidth(100)}>Min</button>
                        <button className={`btn btn-white py-0 border-0 ${enseignantWidth === 200 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.65rem"}} onClick={() => setEnseignantWidth(200)}>Std</button>
                        <button className={`btn btn-white py-0 border-0 ${enseignantWidth === 300 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.65rem"}} onClick={() => setEnseignantWidth(300)}>Max</button>
                    </div>

                    {/* Visibilité */}
                    <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-secondary py-0 shadow-sm border-0" style={{fontSize: "0.65rem", height: "31px", opacity: 0.8}} onClick={() => setCache(enseignants?.map(e => e.id) || [])}>Tout cacher</button>
                        <button className="btn btn-sm btn-primary py-0 shadow-sm border-0" style={{fontSize: "0.65rem", height: "31px", opacity: 0.8}} onClick={() => setCache([])}>Tout afficher</button>
                    </div>

                    {/* Validation */}
                    <button className="btn btn-sm btn-success rounded-pill shadow-sm px-3 fw-bold" style={{height: "31px", fontSize: "0.75rem"}} onClick={valider}>
                        ✅ Valider
                    </button>

                    {/* Help */}
                    <button 
                        className="btn btn-sm btn-link text-muted p-0 ms-auto" 
                        onClick={() => setShowHelp(true)}
                        title="Aide et astuces"
                        style={{textDecoration: "none", fontSize: "1rem"}}
                    >
                        ❔
                    </button>
                </div>

                {/* Chips Enseignants cachés */}
                {cache.length > 0 && (
                    <div className="d-flex gap-1 flex-wrap align-items-center mt-2 animate-fade-in border-top pt-2">
                        <span className="extra-small text-muted fw-bold text-uppercase me-1" style={{fontSize: "0.6rem"}}>Cachés:</span>
                        {(enseignants ?? [])
                            .filter(e => cache.includes(e.id))
                            .toSorted((a, b) => (a.nom ?? "").localeCompare(b.nom ?? ""))
                            .map(e => (
                                <button 
                                    key={e.id} 
                                    className="btn btn-xs btn-outline-info rounded-pill py-0 px-2 d-flex align-items-center gap-1" 
                                    style={{fontSize: "0.65rem", height: "20px"}}
                                    onClick={() => setCache(cache.filter(id => id !== e.id))}
                                >
                                    {e.nom} <span style={{fontSize: "10px"}}>✕</span>
                                </button>
                            ))
                        }
                    </div>
                )}
                
                {showHelp && (
                    <div 
                        className="modal d-block" 
                        style={{backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060}}
                        onClick={() => setShowHelp(false)}
                    >
                        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                            <div className="modal-content shadow-lg border-0">
                                <div className="modal-header bg-info text-white border-0 py-2">
                                    <h6 className="modal-title">🚀 Astuces et Fonctionnalités</h6>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowHelp(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">🖱️</span>Clic Droit (Menu Contextuel)</h6>
                                        <ul className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>
                                            <li>Sur un <strong>enseignant</strong> : Modifier son profil ou le cacher temporairement.</li>
                                            <li>Sur une <strong>charge (cours)</strong> : Transférer à un collègue, modifier les semaines ou voir les détails.</li>
                                            <li>Sur une <strong>libération</strong> : Transférer à un collègue ou modifier la quantité.</li>
                                        </ul>
                                    </div>
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">🖐️</span>Drag and Drop (Glisser-Déposer)</h6>
                                        <p className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>Faites glisser un bloc de cours ou de libération d'un enseignant vers un autre pour le réattribuer instantanément.</p>
                                    </div>
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">🔍</span>Recherche et Organisation</h6>
                                        <ul className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>
                                            <li>Utilisez la <strong>barre de recherche</strong> pour isoler quelques enseignants.</li>
                                            <li>Redimensionnez la première colonne en tirant sur son bord droit.</li>
                                            <li>Le tableau est <strong>auto-enregistré</strong> à chaque modification.</li>
                                        </ul>
                                    </div>
                                    <div className="text-center mt-2">
                                        <button className="btn btn-sm btn-primary rounded-pill px-4" onClick={() => setShowHelp(false)}>J'ai compris !</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="table-responsive flex-grow-1 overflow-auto border rounded shadow-inner bg-white" style={{maxHeight: "none"}}>
                <table className="table table-bordered table-hover align-middle mb-0" style={{fontSize: "0.85rem"}}>
                    <thead className="table-light sticky-top" style={{zIndex: 105}}>
                        <tr>
                            <th 
                                className="bg-light border-end" 
                                style={{
                                    position: "sticky", 
                                    left: 0, 
                                    zIndex: 106, 
                                    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
                                    fontSize: "0.8rem",
                                    padding: "4px 12px",
                                    whiteSpace: "nowrap",
                                    width: "1px"
                                }}
                            >
                                Actions / Enseignants
                            </th>
                            {visibleEnseignants.map(enseignant => (
                                <Enseignant key={enseignant.id} enseignant={enseignant} globalWidth={enseignantWidth} onCache={() => setCache([...cache, enseignant.id])}/>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {saison === "Automne" ? (
                            <>
                                <Tache session={sessionsAnnuelle[0]} visibleEnseignants={visibleEnseignants} scenario={selectedScenarioId} enseignantWidth={enseignantWidth}/>
                                <Tache session={sessionsAnnuelle[1]} visibleEnseignants={visibleEnseignants} scenario={selectedScenarioId} enseignantWidth={enseignantWidth}/>
                            </>
                        ) : (
                            <>
                                <CIReelle session={sessionsAnnuelle[0]} visibleEnseignants={visibleEnseignants} enseignantWidth={enseignantWidth}/>
                                <Tache session={sessionsAnnuelle[1]} visibleEnseignants={visibleEnseignants} scenario={selectedScenarioId} enseignantWidth={enseignantWidth}/>
                            </>
                        )}
                        <Summary session={session} sessions={sessionsAnnuelle} visibleEnseignants={visibleEnseignants} saison={saison} enseignantWidth={enseignantWidth} scenario={selectedScenarioId}/>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}
