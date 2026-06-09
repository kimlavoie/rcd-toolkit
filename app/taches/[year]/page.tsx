'use client'
import { useParams, useRouter } from "next/navigation"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useState, useEffect, useMemo } from "react"
import Enseignant from "../components/Enseignant"
import Tache from "../components/Tache"
import Summary from "../components/Summary"
import CIReelle from "../components/CIReelle"
import TachesToolbar from "../components/TachesToolbar"
import DashboardModal from "../components/DashboardModal"
import { DataProvider, useData } from "../components/DataContext"
import { HistoryProvider } from "../components/HistoryContext"
import StickyHeader from "../components/ui/StickyHeader"
import { useAuth } from "@/app/utilities/auth"
import { toast } from "react-hot-toast"
import { useFilteredEnseignants } from "@/app/utilities/hooks"
import Skeleton from "@/app/utilities/Skeleton";

import { 
    getChargesManquantesCount, 
    getLiberationsManquantesCount, 
    getStagiairesRestantsCount 
} from "@/app/utilities/businessLogic"

function TachesContent() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const year = params.year as string
    
    const { enseignants, groupes, charges, allocations, liberations, stages, supervisions, cours, scenarios, isLoading, triggerExpansion } = useData()

    const isValidYear = year && /^\d{4}$/.test(year);
    const anneeScolaireLabel = isValidYear ? `${year}-${parseInt(year)+1}` : "Inconnue";

    const sessionA = isValidYear ? `A${year.substring(2,4)}` : "";
    const sessionH = isValidYear ? `H${(parseInt(year.substring(2,4)) + 1).toString().padStart(2, '0')}` : "";
    const sessionsAnnuelle = [sessionA, sessionH];

    const [mode, setMode] = useState<"Automne" | "Hiver" >("Automne")
    const [cache, setCache] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [tri, setTri] = useState("nom")
    const [showHelp, setShowHelp] = useState(false)
    const [enseignantWidth, setEnseignantWidth] = useState(200)
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>("production")
    const [isPrinting, setIsPrinting] = useState(false)
    const [teachersPerPage, setTeachersPerPage] = useState(7)
    const [showDashboard, setShowDashboard] = useState(false)

    const getWidth = (id: string) => columnWidths[id] || enseignantWidth

    const handleWidthChange = (id: string, newWidth: number) => {
        setColumnWidths(prev => ({ ...prev, [id]: newWidth }))
    }

    const fitToScreen = () => {
        if (visibleEnseignants.length === 0) return
        const container = document.querySelector('.table-responsive')
        if (!container) return
        const containerWidth = container.clientWidth
        const firstColWidth = 200
        const availableWidth = containerWidth - firstColWidth - 20
        if (availableWidth <= 0) return
        const idealWidth = Math.floor(availableWidth / visibleEnseignants.length)
        const finalWidth = Math.max(100, idealWidth)
        setEnseignantWidth(finalWidth)
        setColumnWidths({})
    }

    const handleExportPDF = () => {
        setIsPrinting(true)
        setTimeout(() => {
            window.print()
            setIsPrinting(false)
        }, 500)
    }

    const handleExportCSV = () => {
        if (!groupes || !charges || !allocations || !liberations || !stages || !supervisions || !cours) {
            toast.error("Données en cours de chargement...")
            return
        }

        const lines = [
            "Session;NoEmploye;Nom;Prenom;TypeTache;Description;Type/Role;Quantite"
        ]

        sessionsAnnuelle.forEach(sCode => {
            visibleEnseignants.forEach(enseignant => {
                const noEmp = enseignant.numeroEmploye || ""
                const nom = `"${enseignant.nom || ""}"`
                const prenom = `"${enseignant.prenom || ""}"`
                
                // 1. Charges (Cours)
                const profCharges = charges.filter((c: any) => c.enseignant === enseignant.id && (c.scenario || "production") === selectedScenarioId)
                profCharges.forEach((c: any) => {
                    const grp = groupes.find((g: any) => g.id === c.groupe && g.session === sCode)
                    if (grp) {
                        const cour = cours.find((crs: any) => crs.id === grp.cours)
                        const desc = `"${cour?.sigle || 'Inconnu'}(${grp.nbEtudiants})"`
                        lines.push(`${sCode};${noEmp};${nom};${prenom};Cours;${desc};${c.type};${c.nbSemaines}`)
                    }
                })

                // 2. Libérations
                const profLibs = liberations.filter((l: any) => l.enseignant === enseignant.id && (l.scenario || "production") === selectedScenarioId)
                profLibs.forEach((l: any) => {
                    const alloc = allocations.find((a: any) => a.id === l.allocation && a.session === sCode)
                    if (alloc) {
                        const desc = `"${alloc.code} - ${alloc.description}"`
                        lines.push(`${sCode};${noEmp};${nom};${prenom};Liberation;${desc};N/A;${l.quantite}`)
                    }
                })

                // 3. Supervisions
                const profSups = supervisions.filter((s: any) => s.enseignant === enseignant.id && (s.scenario || "production") === selectedScenarioId)
                profSups.forEach((s: any) => {
                    const stage = stages.find((st: any) => st.id === s.stage && st.session === sCode)
                    if (stage) {
                        const desc = `"${stage.nom}"`
                        if (s.nbStagiaires > 0) {
                            lines.push(`${sCode};${noEmp};${nom};${prenom};Supervision;${desc};Stagiaires;${s.nbStagiaires}`)
                        }
                        if (s.coordination > 0) {
                            lines.push(`${sCode};${noEmp};${nom};${prenom};Supervision;${desc};Coordination;${s.coordination}`)
                        }
                    }
                })
            })
        })

        const csvContent = lines.join("\n")
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `Export_Taches_${year}_${selectedScenarioId}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Export CSV terminé")
    }

    useEffect(() => {
        if (!isPrinting) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = 'visible';
            document.body.style.overflow = 'visible';
        }
        return () => {
            document.documentElement.style.overflow = 'unset';
            document.body.style.overflow = 'unset';
        };
    }, [isPrinting]);

    const currentSession = mode === "Automne" ? sessionA : sessionH;
    const currentSessionScenarios = scenarios?.filter(s => s.session === currentSession) || []

    useEffect(() => {
        if (currentSessionScenarios.length > 0 && selectedScenarioId === "production") {
            const defaultScenario = currentSessionScenarios.find(s => s.isDefault)
            if (defaultScenario) {
                setSelectedScenarioId(defaultScenario.id)
            }
        }
    }, [scenarios, currentSession])

    // Utilisation du hook de filtrage refactorisé
    const visibleEnseignants = useFilteredEnseignants(
        enseignants,
        cache,
        search,
        tri,
        charges,
        groupes,
        cours,
        liberations,
        allocations,
        selectedScenarioId
    )

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login")
        }
    }, [user, authLoading, router])

    if (authLoading || isLoading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )
    if (!user) return null;
    if (!isValidYear) return <div className="container mt-5 alert alert-danger">Année scolaire invalide: {year}</div>

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

            // 1. Cours restants - Utilisation de la logique métier centralisée (plus granulaire ici pour le rapport)
            const groupesSession = groupes.filter((g: any) => g.session === sCode)
            const groupesIncomplets = groupesSession.map((g: any) => {
                const chargesDuGroupe = charges.filter((c: any) => String(c.groupe) === String(g.id) && (c.scenario || "production") === selectedScenarioId)
                const needsT = g.aTheorie ?? true
                const needsP = g.aPratique ?? true
                const weeksT = chargesDuGroupe.filter((c: any) => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
                const weeksP = chargesDuGroupe.filter((c: any) => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
                const missingT = needsT && (15 - weeksT > 0.001)
                const missingP = needsP && (15 - weeksP > 0.001)
                let details = []
                if (missingT) details.push(`Théorie (${(15 - weeksT).toFixed(1)} sem.)`)
                if (missingP) details.push(`Pratique (${(15 - weeksP).toFixed(1)} sem.)`)
                return { group: g, details }
            }).filter((r: any) => r.details.length > 0)
            
            if (groupesIncomplets.length > 0) {
                sessionReports.push("Cours non complétés :\n" + groupesIncomplets.map((r: any) => {
                    const c = cours.find((c: any) => String(c.id) === String(r.group.cours))
                    return `- ${c?.sigle ?? 'Inconnu'} (Gr. ${r.group.id.substring(0,4)}) : ${r.details.join(" + ")}`
                }).join("\n"))
            }

            // 2. Libérations restantes
            const allocationsSession = allocations.filter((a: any) => a.session === sCode)
            const libRestantes = allocationsSession.map((a: any) => {
                const totalLibere = liberations.filter((l: any) => String(l.allocation) === String(a.id) && (l.scenario || "production") === selectedScenarioId).reduce((sum: number, l: any) => sum + Number(l.quantite), 0)
                return { desc: a.description || a.code, restant: Number(a.quantite) - totalLibere }
            }).filter((r: any) => r.restant > 0.001)

            if (libRestantes.length > 0) {
                sessionReports.push("Libérations restantes :\n" + libRestantes.map((r: any) => `- ${r.desc} : ${r.restant.toFixed(3)}`).join("\n"))
            }

            // 3. Stagiaires à placer
            const stagesSession = stages.filter((s: any) => s.session === sCode)
            const stagRestants = stagesSession.map((s: any) => {
                const totalPlaces = supervisions.filter((sup: any) => String(sup.stage) === String(s.id) && (sup.scenario || "production") === selectedScenarioId).reduce((sum: number, sup: any) => sum + Number(sup.nbStagiaires), 0)
                return { nom: s.nom, restant: Number(s.nbStagiaires) - totalPlaces }
            }).filter((r: any) => r.restant > 0.001)

            if (stagRestants.length > 0) {
                sessionReports.push("Stagiaires à placer :\n" + stagRestants.map((r: any) => `- ${r.nom} : ${r.restant} stagiaire(s) restant(s)`).join("\n"))
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

    const chunkArray = (arr: any[], size: number) => {
        const chunks = []
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }
        return chunks
    }

    const teacherChunks = chunkArray(visibleEnseignants, teachersPerPage)

    if (isPrinting) {
        return (
            <div className="p-4 bg-white">
                {teacherChunks.map((chunk, chunkIdx) => (
                    <div key={chunkIdx} className={chunkIdx < teacherChunks.length - 1 ? "print-page-break mb-5" : ""}>
                        <h2 className="h5 mb-3 text-dark">Tâches Enseignants - Page {chunkIdx + 1} / {teacherChunks.length} ({anneeScolaireLabel})</h2>
                        <table className="table table-bordered align-middle w-100" style={{fontSize: "0.7rem"}}>
                            <thead>
                                <tr className="table-light">
                                    <th style={{width: "150px"}}>Actions / Enseignants</th>
                                    {chunk.map(enseignant => (
                                        <th key={enseignant.id} style={{textAlign: "center"}}>
                                            {enseignant.prenom} {enseignant.nom}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {mode === "Automne" ? (
                                    <>
                                        <Tache session={sessionsAnnuelle[0]} visibleEnseignants={chunk} scenario={selectedScenarioId} globalWidth={150} isPrinting={true} ciTop="auto" ciBottom="auto"/>
                                        <Tache session={sessionsAnnuelle[1]} visibleEnseignants={chunk} scenario={selectedScenarioId} globalWidth={150} isPrinting={true} ciTop="auto" ciBottom="auto"/>
                                    </>
                                ) : (
                                    <>
                                        <CIReelle session={sessionsAnnuelle[0]} visibleEnseignants={chunk} globalWidth={150} ciTop="auto" ciBottom="auto" forceHideCI={true}/>
                                        <Tache session={sessionsAnnuelle[1]} visibleEnseignants={chunk} scenario={selectedScenarioId} globalWidth={150} isPrinting={true} ciTop="auto" ciBottom="auto"/>
                                    </>
                                )}
                                <Summary session={sessionA} sessions={sessionsAnnuelle} visibleEnseignants={chunk} saison={mode} globalWidth={150} scenario={selectedScenarioId} isPrinting={true}/>
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="d-flex flex-column bg-light overflow-hidden" style={{ height: "calc(100vh - 60px)", padding: "0.5rem" }}>
            <div className="card shadow-sm p-2 flex-grow-1 d-flex flex-column overflow-hidden">
                <TachesToolbar 
                    mode={mode} setMode={setMode} anneeScolaireLabel={anneeScolaireLabel}
                    search={search} setSearch={setSearch} tri={tri} setTri={setTri}
                    enseignantWidth={enseignantWidth} setEnseignantWidth={(w) => { setEnseignantWidth(w); setColumnWidths({}); }}
                    teachersPerPage={teachersPerPage} setTeachersPerPage={setTeachersPerPage}
                    selectedScenarioId={selectedScenarioId} setSelectedScenarioId={setSelectedScenarioId}
                    currentSessionScenarios={currentSessionScenarios}
                    onHideAll={() => setCache(enseignants?.map(e => e.id) || [])}
                    onShowAll={() => setCache([])}
                    onExpandAll={() => triggerExpansion("expand")}
                    onCollapseAll={() => triggerExpansion("collapse")}
                    onValidate={valider}
                    onFitToScreen={fitToScreen}
                    onExportPDF={handleExportPDF}
                    onExportCSV={handleExportCSV}
                    setShowHelp={setShowHelp}
                    onShowDashboard={() => setShowDashboard(true)}
                />

                <DashboardModal 
                    isOpen={showDashboard}
                    onClose={() => setShowDashboard(false)}
                    sessionsAnnuelle={sessionsAnnuelle}
                    visibleEnseignants={visibleEnseignants}
                    selectedScenarioId={selectedScenarioId}
                    saison={mode}
                />

                {cache.length > 0 && (
                    <div className="d-flex gap-1 flex-wrap align-items-center mb-2 px-2 border-top pt-2">
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
                    <div className="modal d-block" style={{backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060}} onClick={() => setShowHelp(false)}>
                        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                            <div className="modal-content shadow-lg border-0">
                                <div className="modal-header bg-info text-white border-0 py-2">
                                    <h6 className="modal-title">🚀 Astuces et Fonctionnalités</h6>
                                    <button type="button" className="btn btn-close btn-close-white" onClick={() => setShowHelp(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">🖱️</span>Clic Droit (Menu Contextuel)</h6>
                                        <ul className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>
                                            <li><strong>Sur une case vide</strong> : Ajouter un cours ou une libération.</li>
                                            <li><strong>Sur un bloc existant</strong> : Transférer à un collègue, modifier les quantités ou accéder aux détails.</li>
                                            <li><strong>Sur un enseignant</strong> : Modifier son profil.</li>
                                        </ul>
                                    </div>
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">🎭</span>Scénarios et Simulations</h6>
                                        <p className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>Utilisez le menu <strong>Scénario</strong> en haut pour créer des simulations sans modifier la production. Vous pouvez copier la production actuelle vers un nouveau scénario dans la gestion des scénarios (⚙️).</p>
                                    </div>
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">🖐️</span>Glisser-Déposer</h6>
                                        <p className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>Réattribuez un cours ou une libération en le faisant glisser d'un enseignant vers un autre.</p>
                                    </div>
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small"><span className="me-2">☁️</span>Synchronisation</h6>
                                        <p className="extra-small text-muted ps-3 mb-0" style={{fontSize: "0.8rem"}}>Vos données sont <strong>personnelles et synchronisées</strong> en temps réel dans le cloud. Toutes vos modifications sont enregistrées automatiquement.</p>
                                    </div>
                                    <div className="text-center mt-2">
                                        <button className="btn btn-sm btn-primary rounded-pill px-4" onClick={() => setShowHelp(false)}>C'est compris !</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="table-responsive flex-grow-1 overflow-auto border rounded shadow-inner bg-white" style={{maxHeight: "none"}}>
                    <table className="table table-hover align-middle mb-0" style={{fontSize: "0.85rem", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: "max-content"}}>
                        <thead style={{position: "sticky", top: 0, zIndex: 110}}>
                            <tr className="table-light">
                                <StickyHeader 
                                    isFirstCol 
                                    top="0" 
                                    zIndex={115} 
                                    style={{
                                        backgroundColor: "#f8f9fa",
                                        borderRight: "2px solid #dee2e6",
                                        borderBottom: "1px solid #dee2e6",
                                        padding: "4px 12px",
                                        fontSize: "0.8rem",
                                        width: "200px",
                                        minWidth: "200px",
                                        maxWidth: "200px"
                                    }}
                                >
                                    Actions / Enseignants
                                </StickyHeader>
                                {visibleEnseignants.map(enseignant => (
                                    <Enseignant 
                                        key={enseignant.id} 
                                        enseignant={enseignant} 
                                        globalWidth={getWidth(enseignant.id)} 
                                        onCache={() => setCache([...cache, enseignant.id])}
                                        onWidthChange={(newWidth) => handleWidthChange(enseignant.id, newWidth)}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>{mode === "Automne" ? (
                                <>
                                    <Tache session={sessionsAnnuelle[0]} visibleEnseignants={visibleEnseignants} scenario={selectedScenarioId} columnWidths={columnWidths} globalWidth={enseignantWidth} ciTop="37px" ciBottom="74px" isPrinting={isPrinting}/>
                                    <Tache session={sessionsAnnuelle[1]} visibleEnseignants={visibleEnseignants} scenario={selectedScenarioId} columnWidths={columnWidths} globalWidth={enseignantWidth} ciBottom="37px" isPrinting={isPrinting}/>
                                </>
                                ) : (
                                <>
                                    <CIReelle session={sessionsAnnuelle[0]} visibleEnseignants={visibleEnseignants} columnWidths={columnWidths} globalWidth={enseignantWidth} ciTop="auto" ciBottom="auto" forceHideCI={true}/>
                                    <Tache session={sessionsAnnuelle[1]} visibleEnseignants={visibleEnseignants} scenario={selectedScenarioId} columnWidths={columnWidths} globalWidth={enseignantWidth} ciTop="37px" ciBottom="37px" showCI={true} isPrinting={isPrinting}/>
                                </>
                                )}<Summary session={sessionA} sessions={sessionsAnnuelle} visibleEnseignants={visibleEnseignants} saison={mode} columnWidths={columnWidths} globalWidth={enseignantWidth} scenario={selectedScenarioId}/></tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default function() {
    const params = useParams()
    const year = params.year as string
    const isValidYear = year && /^\d{4}$/.test(year);
    
    const sessionA = isValidYear ? `A${year.substring(2,4)}` : "";
    const sessionH = isValidYear ? `H${(parseInt(year.substring(2,4)) + 1).toString().padStart(2, '0')}` : "";
    
    const sessionsAnnuelle = useMemo(() => [sessionA, sessionH], [sessionA, sessionH]);

    return (
        <DataProvider sessions={sessionsAnnuelle}>
            <HistoryProvider>
                <TachesContent />
            </HistoryProvider>
        </DataProvider>
    )
}
