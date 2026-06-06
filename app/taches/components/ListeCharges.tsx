'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Groupe, Charge as ChargeType, Cours, Enseignant } from "@/app/db/db"
import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import Charge from "./Charge"
import { getGroupColor as getGroupColorUtil } from "@/app/utilities/groupColors"
import InputModal from "./InputModal"
import TransferModal from "./TransferModal"
import { toast } from "react-hot-toast"

export default function ListeCharges({enseignant, session, enseignantWidth, scenario = "production", style}: {enseignant: Enseignant, session: string, enseignantWidth: number, scenario?: string, style?: any}){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null)

    const groupesData = useFirestoreCollection<Groupe>("groupes")
    const allChargesData = useFirestoreCollection<ChargeType>("charges")
    const coursData = useFirestoreCollection<Cours>("cours")

    // 1. Filtrage initial par scénario et session
    const scenarioCharges = useMemo(() => 
        allChargesData?.filter(c => (c.scenario || "production") === scenario) || []
    , [allChargesData, scenario])

    const sessionGroupes = useMemo(() => 
        groupesData?.filter(g => g.session === session) || []
    , [groupesData, session])

    // 2. Logique pour le menu d'ajout (clic droit sur cellule vide)
    const [menuSearch, setMenuSearch] = useState("")

    const availableGroupsForMenu = useMemo(() => {
        return sessionGroupes.filter(groupe => {
            // Déterminer ce qui est déjà assigné globalement pour ce groupe
            const groupCharges = scenarioCharges.filter(c => c.groupe === groupe.id)
            
            const totalT = groupCharges.filter(c => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
            const totalP = groupCharges.filter(c => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
            
            // Ce qui est requis par le groupe mais pas encore totalement assigné
            const canStillAddT = (groupe.aTheorie ?? true) && (15 - totalT > 0.001)
            const canStillAddP = (groupe.aPratique ?? true) && (15 - totalP > 0.001)

            // Ce que l'enseignant actuel possède déjà
            const teacherHasT = groupCharges.some(c => c.enseignant === enseignant.id && (c.type === "T" || c.type === "TP"))
            const teacherHasP = groupCharges.some(c => c.enseignant === enseignant.id && (c.type === "P" || c.type === "TP"))

            // Le groupe est proposé si l'enseignant peut encore ajouter une partie non totalement assignée
            const isAvailableForTeacher = (canStillAddT && !teacherHasT) || (canStillAddP && !teacherHasP)

            if (!isAvailableForTeacher) return false

            if (menuSearch) {
                const cour = coursData?.find(c => c.id == groupe.cours)
                const searchLower = menuSearch.toLowerCase()
                return (cour?.sigle?.toLowerCase().includes(searchLower) || cour?.nom?.toLowerCase().includes(searchLower))
            }
            return true
        })
    }, [sessionGroupes, scenarioCharges, enseignant.id, menuSearch, coursData])

    const groupsByCourseForMenu = useMemo(() => {
        const map: Record<string, Groupe[]> = {}
        availableGroupsForMenu.forEach(g => {
            if (!map[g.cours]) map[g.cours] = []
            map[g.cours].push(g)
        })
        return map
    }, [availableGroupsForMenu])

    const sortedCourseIdsForMenu = useMemo(() => 
        Object.keys(groupsByCourseForMenu).sort((a, b) => {
            const courA = coursData?.find(c => c.id == a)
            const courB = coursData?.find(c => c.id == b)
            return (courA?.sigle || "").localeCompare(courB?.sigle || "")
        })
    , [groupsByCourseForMenu, coursData])

    // 3. Logique pour l'affichage du tableau (charges déjà assignées)
    const teacherChargesInSession = useMemo(() => 
        scenarioCharges.filter(c => 
            c.enseignant === enseignant.id && 
            sessionGroupes.some(g => g.id === c.groupe)
        )
    , [scenarioCharges, enseignant.id, sessionGroupes])

    const chargesByCourseForDisplay = useMemo(() => {
        const map: Record<string, ChargeType[]> = {}
        teacherChargesInSession.forEach(c => {
            const g = sessionGroupes.find(gr => gr.id === c.groupe)
            if (g) {
                if (!map[g.cours]) map[g.cours] = []
                map[g.cours].push(c)
            }
        })
        return map
    }, [teacherChargesInSession, sessionGroupes])

    const sortedCourseIdsForDisplay = useMemo(() => 
        Object.keys(chargesByCourseForDisplay).sort((a, b) => {
            const courA = coursData?.find(c => c.id == a)
            const courB = coursData?.find(c => c.id == b)
            return (courA?.sigle || "").localeCompare(courB?.sigle || "")
        })
    , [chargesByCourseForDisplay, coursData])

    // 4. Gestionnaires d'actions
    const [expandedMenuCourses, setExpandedMenuCourses] = useState<Record<string, boolean>>({})
    const [expandedDisplayCourses, setExpandedDisplayCourses] = useState<Record<string, boolean>>({})

    useEffect(() => {
        setMounted(true)
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setHideMenu(true);
                setMenuSearch("");
            }
        };
        if (!hideMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [hideMenu]);

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    async function removeHandlerCharge(groupeId: string, enseignantId: string){
        const charge = scenarioCharges.find(c => c.groupe == groupeId && c.enseignant == enseignantId)
        if(charge) await firebaseDb.charges.delete(charge.id)
    }

    async function quickAddCharge(groupe: Groupe, type: "T" | "P" | "TP" = "TP"){
        const groupCharges = scenarioCharges.filter(c => c.groupe === groupe.id)
        const existingCharge = groupCharges.find(c => c.enseignant === enseignant.id)
        
        // Calculer les semaines restantes globales pour chaque partie
        const totalT = groupCharges.filter(c => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
        const totalP = groupCharges.filter(c => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
        
        const remT = Math.max(0, Number((15 - totalT).toFixed(3)))
        const remP = Math.max(0, Number((15 - totalP).toFixed(3)))

        if (existingCharge) {
            // Fusion ou mise à jour
            if ((existingCharge.type === "T" && type === "P") || (existingCharge.type === "P" && type === "T") || type === "TP") {
                await firebaseDb.charges.update(existingCharge.id, { type: "TP", nbSemaines: 15 })
            } else {
                const finalWeeks = type === "T" ? remT : type === "P" ? remP : 15
                await firebaseDb.charges.update(existingCharge.id, { type, nbSemaines: finalWeeks })
            }
        } else {
            // Nouvel ajout intelligent
            if (type === "TP") {
                await firebaseDb.charges.add({groupe: groupe.id, enseignant: enseignant.id, nbSemaines: 15, scenario, type: "TP"})
            } else {
                const finalWeeks = type === "T" ? remT : remP
                await firebaseDb.charges.add({groupe: groupe.id, enseignant: enseignant.id, nbSemaines: finalWeeks, scenario, type})
            }
        }
        // Suppression de setHideMenu(true) pour permettre des sélections multiples
        setMenuSearch("");
    }

    async function addAllCourseGroups(groupeList: Groupe[]){
        for(const groupe of groupeList){
            await quickAddCharge(groupe, "TP")
        }
        // Suppression de setHideMenu(true)
        setMenuSearch("");
    }

    // 5. Gestion du menu de regroupement (Tout supprimer / Tout transférer)
    const [groupMenu, setGroupMenu] = useState<{show: boolean, pos: {left: number, top: number}, courseId: string | null}>({show: false, pos: {left: 0, top: 0}, courseId: null})
    const groupMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
                setGroupMenu(prev => ({...prev, show: false}));
            }
        };
        if (groupMenu.show) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [groupMenu.show]);

    function openGroupMenu(ev: React.MouseEvent, courseId: string){
        ev.preventDefault()
        ev.stopPropagation()
        setGroupMenu({show: true, pos: {left: ev.clientX, top: ev.clientY}, courseId})
    }

    async function removeAllCourseCharges(courseId: string){
        const courseCharges = teacherChargesInSession.filter(c => {
            const g = sessionGroupes.find(gr => gr.id === c.groupe)
            return g?.cours === courseId
        })
        for (const charge of courseCharges) {
            await firebaseDb.charges.delete(charge.id)
        }
        toast.success("Toutes les charges du cours ont été supprimées")
        setGroupMenu(prev => ({...prev, show: false}))
    }

    const [groupTransferOpen, setGroupTransferOpen] = useState(false)
    const [transferCourseId, setGroupTransferCourseId] = useState<string | null>(null)

    async function handleGroupTransferConfirm(targetEnseignantId: string){
        if (!transferCourseId) return
        const courseCharges = teacherChargesInSession.filter(c => {
            const g = sessionGroupes.find(gr => gr.id === c.groupe)
            return g?.cours === transferCourseId
        })
        
        let count = 0
        for (const charge of courseCharges) {
            const exists = scenarioCharges.find(c => c.enseignant == targetEnseignantId && c.groupe == charge.groupe)
            if (exists) {
                if ((exists.type === "T" && charge.type === "P") || (exists.type === "P" && charge.type === "T")) {
                    await firebaseDb.charges.update(exists.id, { type: "TP" })
                    await firebaseDb.charges.delete(charge.id)
                    count++
                }
            } else {
                await firebaseDb.charges.update(charge.id, { enseignant: targetEnseignantId })
                count++
            }
        }
        toast.success(`${count} charge(s) transférée(s)`)
        setGroupTransferOpen(false)
    }

    // 6. Drag and Drop
    async function dropHandlerCharge(ev: any) {
        ev.currentTarget.style.boxShadow = ""
        ev.currentTarget.style.backgroundColor = ""
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId
        if (!idNouveauEnseignant) return

        const idCourse = ev.dataTransfer.getData("courseId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        if (idCourse) {
            const courseCharges = allChargesData?.filter(c => {
                const g = groupesData?.find(gr => gr.id === c.groupe)
                return c.enseignant == idAncienEnseignant && g?.cours === idCourse && (c.scenario || "production") === scenario
            }) || []

            let count = 0
            for (const charge of courseCharges) {
                const existingInTarget = scenarioCharges.find(c => c.enseignant == idNouveauEnseignant && c.groupe == charge.groupe)
                if (existingInTarget) {
                    if ((existingInTarget.type === "T" && charge.type === "P") || (existingInTarget.type === "P" && charge.type === "T")) {
                        await firebaseDb.charges.update(existingInTarget.id, { type: "TP" })
                        await firebaseDb.charges.delete(charge.id)
                        count++
                    }
                } else {
                    await firebaseDb.charges.update(charge.id, { enseignant: idNouveauEnseignant })
                    count++
                }
            }
            if (count > 0) toast.success(`${count} groupe(s) transféré(s)`)
            return
        }

        const idGroupe = ev.dataTransfer.getData("groupeId")
        const ancienneCharge = scenarioCharges.find(c => c.enseignant == idAncienEnseignant && c.groupe == idGroupe)
        const chargeExisteDeja = scenarioCharges.find(c => c.enseignant == idNouveauEnseignant && c.groupe == idGroupe)

        if (chargeExisteDeja && ancienneCharge) {
            if ((chargeExisteDeja.type === "T" && ancienneCharge.type === "P") || (chargeExisteDeja.type === "P" && ancienneCharge.type === "T")) {
                await firebaseDb.charges.update(chargeExisteDeja.id, { type: "TP" })
                await firebaseDb.charges.delete(ancienneCharge.id)
                toast.success("Charges fusionnées en T+P")
                return
            }
            toast.error("Cet enseignant a déjà cette charge")
            return
        }

        if (ancienneCharge) {
            await firebaseDb.charges.update(ancienneCharge.id, { enseignant: idNouveauEnseignant })
            toast.success("Charge déplacée")
        }
    }

    useEffect(() => {
        if (!hideMenu && menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;
            
            let newLeft = position.left;
            let newTop = position.top;

            // Ajustement horizontal
            if (position.left + rect.width > innerWidth) {
                newLeft = Math.max(10, innerWidth - rect.width - 10);
            }
            // Ajustement vertical
            if (position.top + rect.height > innerHeight) {
                newTop = Math.max(10, innerHeight - rect.height - 10);
            }

            if (newLeft !== position.left || newTop !== position.top) {
                setPosition({ left: newLeft, top: newTop });
            }
        }
    }, [hideMenu, position.left, position.top, expandedMenuCourses]); // On réagit aussi aux expansions

    const menuContent = !hideMenu && (
        <div ref={menuRef} style={{ 
            position: "fixed", 
            left: position.left, 
            top: position.top, 
            backgroundColor: "#212529", 
            color: "white", 
            display: "block", 
            padding: "10px", 
            zIndex: 9999, 
            borderRadius: "8px", 
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)", 
            minWidth: "280px", 
            border: "1px solid #444", 
            maxHeight: "85vh", 
            overflowY: "auto", 
            opacity: (position.left === 0 && position.top === 0) ? 0 : 1,
            transition: "top 0.2s, left 0.2s"
        }}>
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Ajouter un cours</p>
            <div className="mb-3">
                <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Rechercher sigle ou nom..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} autoFocus />
            </div>
            {sortedCourseIdsForMenu.length === 0 && <p className="text-muted small text-center my-3">Aucun cours disponible</p>}
            {sortedCourseIdsForMenu.map(courseId => {
                const cour = coursData?.find(c => c.id == courseId)
                const courseGroups = groupsByCourseForMenu[courseId]
                const isExpanded = expandedMenuCourses[courseId]
                return <div key={courseId} className="mb-1 border-bottom border-secondary last-child-no-border pb-1">
                    <div className="d-flex align-items-stretch gap-1">
                        <button 
                            className="btn btn-outline-light btn-sm flex-grow-1 text-start py-2 d-flex justify-content-between align-items-center transition-all" 
                            style={{fontSize: '0.8rem', border: 'none', transition: "background-color 0.2s"}} 
                            onClick={() => addAllCourseGroups(courseGroups)}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                            title={`Assigner toutes les parties disponibles de ce cours`}
                        >
                            <div style={{lineHeight: "1.2"}}>
                                <span className="fw-bold text-info">{cour?.sigle}</span><br/>
                                <span className="text-white-50 extra-small fw-normal">{cour?.nom}</span>
                            </div>
                            <span className="badge bg-info text-dark rounded-pill ms-2 shadow-sm" style={{fontSize: '0.65rem'}}>
                                <span style={{marginRight: "2px"}}>👥</span>
                                {courseGroups.length}
                            </span>
                        </button>
                        <button className="btn btn-link btn-sm text-secondary p-2" style={{textDecoration: 'none'}} onClick={(e) => { e.stopPropagation(); setExpandedMenuCourses(prev => ({...prev, [courseId]: !prev[courseId]})); }} title={isExpanded ? "Réduire" : "Voir les groupes"}>{isExpanded ? "▲" : "▼"}</button>
                    </div>
                    {isExpanded && (
                        <div className="bg-dark rounded p-2 mb-2 mx-1 mt-1 border border-secondary shadow-inner text-center">
                            {courseGroups.map((groupe, idx) => {
                                const groupCharges = scenarioCharges.filter(c => c.groupe == groupe.id)
                                const hasT = groupCharges.some(c => c.type === "T" || c.type === "TP")
                                const hasP = groupCharges.some(c => c.type === "P" || c.type === "TP")
                                const teacherHasAny = groupCharges.some(c => c.enseignant === enseignant.id)
                                const canAddT = (groupe.aTheorie ?? true) && !hasT
                                const canAddP = (groupe.aPratique ?? true) && !hasP
                                const canAddTP = canAddT && canAddP && !teacherHasAny
                                return <div 
                                    key={groupe.id} 
                                    className="mb-2 p-2 border border-secondary rounded text-center transition-all cursor-pointer shadow-sm"
                                    style={{ 
                                        transition: "all 0.2s",
                                        backgroundColor: "rgba(255,255,255,0.03)",
                                        display: "block",
                                        border: "1px solid rgba(255,255,255,0.1) !important"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
                                    onClick={() => quickAddCharge(groupe, "TP")}
                                    title="Cliquez ici pour assigner toutes les parties disponibles"
                                >
                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                        <div className="badge rounded-pill bg-info text-dark shadow-sm d-flex align-items-center py-1 px-2" style={{fontSize: "0.65rem"}}>
                                            <span style={{fontSize: "0.75rem", marginRight: "4px"}}>👤</span>
                                            <span className="fw-bold">{groupe.nbEtudiants}</span>
                                        </div>
                                        <div 
                                            style={{ 
                                                width: "10px", 
                                                height: "10px", 
                                                borderRadius: "50%", 
                                                backgroundColor: getGroupColorUtil(groupe.id),
                                                boxShadow: "0 0 3px rgba(0,0,0,0.5)",
                                                flexShrink: 0
                                            }}
                                        ></div>
                                    </div>
                                    <div className="d-flex gap-1 justify-content-center" onClick={e => e.stopPropagation()}>
                                        {canAddT && (
                                            <button 
                                                className="btn btn-xs btn-primary py-0 px-2 shadow-sm" 
                                                style={{fontSize: '0.65rem', transition: "transform 0.1s"}} 
                                                onClick={() => quickAddCharge(groupe, "T")}
                                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                                title="Assigner la Théorie uniquement"
                                            >
                                                T
                                            </button>
                                        )}
                                        {canAddP && (
                                            <button 
                                                className="btn btn-xs btn-success py-0 px-2 shadow-sm" 
                                                style={{fontSize: '0.65rem', transition: "transform 0.1s"}} 
                                                onClick={() => quickAddCharge(groupe, "P")}
                                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                                title="Assigner la Pratique uniquement"
                                            >
                                                P
                                            </button>
                                        )}
                                        <button className="btn btn-xs btn-outline-secondary py-0 px-1 shadow-sm" onClick={() => {setSelectedGroupe(groupe); setModalOpen(true);}} title="Paramètres personnalisés">⚙️</button>
                                    </div>
                                </div>
                            })}
                        </div>
                    )}
                </div>
            })}
        </div>
    )

    const groupMenuUI = groupMenu.show && (
        <div ref={groupMenuRef} style={{ position: "fixed", left: groupMenu.pos.left, top: groupMenu.pos.top, backgroundColor: "#212529", color: "white", display: "block", padding: "10px", zIndex: 10000, borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "200px", border: "1px solid #444" }}>
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Gestion du cours</p>
            <p className="mb-2"><button className="btn btn-danger btn-sm w-100" onClick={() => removeAllCourseCharges(groupMenu.courseId!)}>🗑️ Tout supprimer</button></p>
            <p className="mb-2"><button className="btn btn-primary btn-sm w-100" onClick={() => { setGroupTransferCourseId(groupMenu.courseId); setGroupTransferOpen(true); setGroupMenu(prev => ({...prev, show: false})); }}>📤 Tout transférer...</button></p>
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={() => window.open("/admin/cours?highlight=" + groupMenu.courseId, "_blank")}>🔍 Modifier le cours</button></p>
        </div>
    )

    const getCellStyle = () => ({ ...style, borderRight: "1px solid #dee2e6", borderBottom: "1px solid #dee2e6", minWidth: `${enseignantWidth}px`, width: `${enseignantWidth}px`, maxWidth: `${enseignantWidth}px`, overflow: "hidden" })

    return <td onContextMenu={openMenu} style={getCellStyle()} data-dropzone="charge" data-enseignant-id={enseignant.id} onDrop={dropHandlerCharge} onDragOver={e => e.preventDefault()} onDragEnter={e => { e.preventDefault(); e.currentTarget.style.boxShadow = "inset 0 0 0 2px #0d6efd"; e.currentTarget.style.backgroundColor = "rgba(13, 110, 253, 0.05)"; }} onDragLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.backgroundColor = ""; }}>
        {sortedCourseIdsForDisplay.map(courseId => {
            const courseCharges = chargesByCourseForDisplay[courseId]
            const cour = coursData?.find(c => c.id == courseId)
            const isExpanded = expandedDisplayCourses[courseId]
            const courseColor = cour?.couleur || "#0dcaf0"
            return <div key={courseId} className="mb-2 rounded shadow-sm overflow-hidden" style={{ border: "1px solid #ddd", borderLeft: `6px solid ${courseColor}`, backgroundColor: "white", display: "block", cursor: "grab" }} draggable="true" onDragStart={ev => { ev.dataTransfer.setData("courseId", courseId); ev.dataTransfer.setData("enseignantId", enseignant.id); }} onContextMenu={e => openGroupMenu(e, courseId)}>
                <div 
                    className="d-flex justify-content-between align-items-center cursor-pointer p-2" 
                    onClick={() => setExpandedDisplayCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }))}
                    style={{ fontSize: "0.8rem", cursor: "pointer" }}
                >
                    <div className="flex-grow-1 min-width-0">
                        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                            <span className="fw-bold text-dark text-truncate">{cour?.sigle}</span>
                            <div className="d-flex gap-1 flex-shrink-0">
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.65rem" }} title="Nombre de groupes">
                                    <span style={{marginRight: "3px"}}>👥</span>
                                    {courseCharges.length}
                                </span>
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.65rem" }} title="Total des étudiants">
                                    <span style={{marginRight: "3px"}}>👤</span>
                                    {courseCharges.reduce((sum, c) => {
                                        const g = sessionGroupes.find(gr => gr.id === c.groupe)
                                        return sum + (g?.nbEtudiants ?? 0)
                                    }, 0)}
                                </span>
                            </div>
                        </div>
                        <div className="text-muted text-truncate d-none d-xl-block" style={{ fontSize: "0.7rem" }}>
                            {cour?.nom}
                        </div>
                    </div>
                    <div className="d-flex align-items-center ps-2 flex-shrink-0">
                        <span style={{ fontSize: "0.65rem", color: "#666" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                </div>
                {isExpanded && <div className="p-2 pt-0"><div className="ps-2 border-start" style={{ borderColor: "#eee" }}>{courseCharges.map(charge => { const groupe = sessionGroupes.find(g => g.id == charge.groupe); if(!groupe || !cour) return null; return <Charge key={charge.id} session={session} charge={charge} groupe={groupe} cours={cour} charges={scenarioCharges} enseignantId={enseignant.id} onRemove={removeHandlerCharge} scenario={scenario} minimal={true}/> })}</div></div>}
            </div>
        })}
        {mounted && menuContent && createPortal(menuContent, document.body)}
        {mounted && groupMenuUI && createPortal(groupMenuUI, document.body)}
        <InputModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={val => { if(selectedGroupe) firebaseDb.charges.add({groupe: selectedGroupe.id, enseignant: enseignant.id, nbSemaines: val, scenario, type: "TP"}).then(() => { setModalOpen(false); setHideMenu(true); }) }} title="Ajouter une charge" label={`Nombre de semaines pour ${selectedGroupe ? coursData?.find(c => c.id === selectedGroupe.cours)?.sigle : ''} :`} defaultValue={15} max={15} />
        {transferCourseId && <TransferModal isOpen={groupTransferOpen} onClose={() => setGroupTransferOpen(false)} onConfirm={handleGroupTransferConfirm} title={`Transférer tout le cours ${coursData?.find(c => c.id === transferCourseId)?.sigle}`} currentEnseignantId={enseignant.id} />}
    </td>
}
