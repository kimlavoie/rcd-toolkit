'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Charge from "./Charge";
import InputModal from "./InputModal";
import type { Groupe, Charge as ChargeType, Cours, Enseignant } from "@/app/db/db"
import { toast } from "react-hot-toast"

export default function ListeCharges({enseignant, session, enseignantWidth, scenario = "production", style}: {enseignant: Enseignant, session: string, enseignantWidth: number, scenario?: string, style?: any}){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null)

    const groupes = useFirestoreCollection<Groupe>("groupes")
    const allCharges = useFirestoreCollection<ChargeType>("charges")
    const cours = useFirestoreCollection<Cours>("cours")

    // Filter by scenario
    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario)

    const [menuSearch, setMenuSearch] = useState("")

    useEffect(() => {
        setMounted(true)
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setHideMenu(true);
                setMenuSearch("");
            }
        };

        if (!hideMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [hideMenu]);

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    async function removeHandlerCharge(groupeId: string, enseignantId: string){
        const charge = charges?.find(charge => charge.groupe == groupeId && charge.enseignant == enseignantId)
        if(charge){
            await firebaseDb.charges.delete(charge.id)
        }
    }

    async function addHandlerCharge(quantite: number){
        if(selectedGroupe){
            await firebaseDb.charges.add({groupe: selectedGroupe.id, enseignant: enseignant.id, nbSemaines: quantite, scenario})
            setModalOpen(false)
            setHideMenu(true)
            setMenuSearch("");
        }
    }

    async function quickAddCharge(groupe: Groupe, quantite: number){
        await firebaseDb.charges.add({groupe: groupe.id, enseignant: enseignant.id, nbSemaines: quantite, scenario})
        setHideMenu(true)
        setMenuSearch("");
    }

    async function addAllCourseGroups(groupeList: Groupe[]){
        for(const groupe of groupeList){
            const totalCharges = charges?.filter(charge => charge.groupe == groupe.id).reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
            const remaining = 15 - (totalCharges ?? 0)
            if(remaining > 0.001){
                await firebaseDb.charges.add({groupe: groupe.id, enseignant: enseignant.id, nbSemaines: Math.min(15, remaining), scenario})
            }
        }
        setHideMenu(true)
        setMenuSearch("");
    }

    function dragOverHandlerCharge(ev: any) {
        ev.preventDefault()
    }

    async function dropHandlerCharge(ev: any) {
        ev.currentTarget.style.boxShadow = ""
        ev.currentTarget.style.backgroundColor = ""
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId

        if (!idNouveauEnseignant) return

        const idCourse = ev.dataTransfer.getData("courseId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        if (idCourse) {
            const courseCharges = charges?.filter(c => {
                const g = groupes?.find(gr => gr.id === c.groupe)
                return c.enseignant == idAncienEnseignant && g?.cours === idCourse
            })

            if (!courseCharges || courseCharges.length === 0) return

            let count = 0
            for (const charge of courseCharges) {
                const chargeExiste = charges?.find(c => c.enseignant == idNouveauEnseignant && c.groupe == charge.groupe)
                if (!chargeExiste) {
                    await firebaseDb.charges.update(charge.id, { enseignant: idNouveauEnseignant })
                    count++
                }
            }
            if (count > 0) toast.success(`${count} groupe(s) transféré(s)`)
            return
        }

        const idGroupe = ev.dataTransfer.getData("groupeId")
        // ... rest of single group drop logic
        const ancienneCharge = charges?.find(charge => charge.enseignant == idAncienEnseignant && charge.groupe == idGroupe)
        const chargeExiste = charges?.find(charge => charge.enseignant == idNouveauEnseignant && charge.groupe == idGroupe)

        if (chargeExiste) {
            toast.error("Cet enseignant a déjà cette charge")
            return
        }

        const nouvelleCharge = {
            enseignant: idNouveauEnseignant,
            groupe: idGroupe,
            nbSemaines: ancienneCharge?.nbSemaines ?? 0,
            scenario
        }

        await firebaseDb.charges.add(nouvelleCharge)
        if (ancienneCharge) {
            await firebaseDb.charges.delete(ancienneCharge.id)
        }
        toast.success("Charge déplacée")
    }

    function dragEnter(ev: any) {
        ev.preventDefault()
        if (ev.currentTarget.dataset.dropzone == "charge" && ev.dataTransfer.types.includes("groupeid")) {
            ev.currentTarget.style.boxShadow = "inset 0 0 0 2px #0d6efd"
            ev.currentTarget.style.backgroundColor = "rgba(13, 110, 253, 0.05)"
        }
    }

    function dragLeave(ev: any) {
        if (!ev.currentTarget.contains(ev.relatedTarget)) {
            ev.currentTarget.style.boxShadow = ""
            ev.currentTarget.style.backgroundColor = ""
        }
    }

    const currentGroupeCharges = charges?.filter(charge => charge.groupe == selectedGroupe?.id)
    const currentGroupeSomme = currentGroupeCharges?.reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
    const currentGroupeMax = 15 - (currentGroupeSomme ?? 0)

    useEffect(() => {
        if (!hideMenu && menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;
            
            let newLeft = position.left;
            let newTop = position.top;

            if (position.left + rect.width > innerWidth) {
                newLeft = Math.max(10, innerWidth - rect.width - 10);
            }
            if (position.top + rect.height > innerHeight) {
                newTop = Math.max(10, innerHeight - rect.height - 10);
            }

            if (newLeft !== position.left || newTop !== position.top) {
                setPosition({ left: newLeft, top: newTop });
            }
        }
    }, [hideMenu, position.left, position.top]);

    const availableGroups = groupes?.filter(groupe => {
        if(groupe.session != session) return false
        const charge = charges?.find(charge => charge.groupe == groupe.id && charge.enseignant == enseignant.id)
        if(charge) return false
        const totalCharges = charges?.filter(charge => charge.groupe == groupe.id).reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
        if(15 - (totalCharges ?? 0) < 0.001) return false
        
        if (menuSearch) {
            const cour = cours?.find(c => c.id == groupe.cours)
            const searchLower = menuSearch.toLowerCase()
            return (cour?.sigle?.toLowerCase().includes(searchLower) || cour?.nom?.toLowerCase().includes(searchLower))
        }
        
        return true
    })

    const groupsByCourse: Record<string, Groupe[]> = {}
    availableGroups?.forEach(g => {
        if(!groupsByCourse[g.cours]) groupsByCourse[g.cours] = []
        groupsByCourse[g.cours].push(g)
    })

    const sortedCourseIds = Object.keys(groupsByCourse).sort((a, b) => {
        const courA = cours?.find(c => c.id == a)
        const courB = cours?.find(c => c.id == b)
        return (courA?.sigle || "").localeCompare(courB?.sigle || "")
    })

    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({})

    const toggleCourse = (courseId: string, ev: React.MouseEvent) => {
        ev.stopPropagation()
        setExpandedCourses(prev => ({...prev, [courseId]: !prev[courseId]}))
    }

    const menuContent = !hideMenu && (
        <div 
            ref={menuRef}
            style={{
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
                maxHeight: "80vh",
                overflowY: "auto",
                opacity: (position.left === 0 && position.top === 0) ? 0 : 1
            }}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Ajouter un cours</p>
            <div className="mb-3">
                <input 
                    type="text" 
                    className="form-control form-control-sm bg-dark text-white border-secondary" 
                    placeholder="Rechercher sigle ou nom..." 
                    value={menuSearch} 
                    onChange={e => setMenuSearch(e.target.value)}
                    autoFocus
                />
            </div>
            
            {sortedCourseIds.length === 0 && <p className="text-muted small text-center my-3">Aucun cours disponible</p>}

            {sortedCourseIds.map(courseId => {
                const cour = cours?.find(c => c.id == courseId)
                const courseGroups = groupsByCourse[courseId]
                const isExpanded = expandedCourses[courseId]
                
                return <div key={courseId} className="mb-1 border-bottom border-secondary last-child-no-border pb-1">
                    <div className="d-flex align-items-stretch gap-1">
                        <button 
                            className="btn btn-outline-light btn-sm flex-grow-1 text-start py-2 d-flex justify-content-between align-items-center" 
                            style={{fontSize: '0.8rem', border: 'none'}}
                            onClick={() => addAllCourseGroups(courseGroups)}
                            title={`Assigner tous les groupes (${courseGroups.length})`}
                        >
                            <div style={{lineHeight: "1.2"}}>
                                <span className="fw-bold text-info">{cour?.sigle}</span><br/>
                                <span className="text-white-50 extra-small fw-normal">{cour?.nom}</span>
                            </div>
                            <span className="badge bg-primary rounded-pill ms-2" style={{fontSize: '0.65rem'}}>{courseGroups.length} gr.</span>
                        </button>
                        <button 
                            className="btn btn-link btn-sm text-secondary p-2" 
                            style={{textDecoration: 'none'}}
                            onClick={(e) => toggleCourse(courseId, e)}
                            title={isExpanded ? "Réduire" : "Voir les groupes"}
                        >
                            {isExpanded ? "▲" : "▼"}
                        </button>
                    </div>

                    {isExpanded && (
                        <div className="bg-dark rounded p-2 mb-2 mx-1 mt-1 border border-secondary shadow-inner">
                            {courseGroups.map((groupe, idx) => {
                                const totalCharges = charges?.filter(c => c.groupe == groupe.id).reduce((somme, c) => somme + (c.nbSemaines ?? 0), 0)
                                const remaining = 15 - (totalCharges ?? 0)
                                const isPartial = remaining < 14.999
                                
                                return <div key={groupe.id} className="d-flex gap-1 mb-1 align-items-stretch">
                                    <button 
                                        className="btn btn-outline-info btn-sm flex-grow-1 text-start py-1 px-2 d-flex justify-content-between align-items-center" 
                                        style={{fontSize: '0.75rem', border: '1px solid rgba(13, 202, 240, 0.2)'}}
                                        onClick={() => quickAddCharge(groupe, Math.min(15, remaining))}
                                        title={isPartial ? `Assigner le reste (${remaining.toFixed(1)} sem.)` : "Assigner 15 semaines"}
                                    >
                                        <span>Gr. {idx + 1} ({groupe.nbEtudiants} étud.)</span>
                                        {isPartial && <span className="badge bg-warning text-dark ms-2" style={{fontSize: '0.6rem'}}>{remaining.toFixed(1)} sem.</span>}
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary btn-sm px-2 py-1" 
                                        title="Assignation personnalisée (semaines)"
                                        style={{fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)'}}
                                        onClick={() => {setSelectedGroupe(groupe); setModalOpen(true);}}
                                    >
                                        ⚙️
                                    </button>
                                </div>
                            })}
                        </div>
                    )}
                </div>
            })}
        </div>
    )

    const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
    const groupesSession = groupes?.filter(groupe => groupe.session == session)
    const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))

    const chargesByCourse: Record<string, ChargeType[]> = {}
    chargesSession?.forEach(c => {
        const g = groupes?.find(gr => gr.id === c.groupe)
        if (g) {
            if (!chargesByCourse[g.cours]) chargesByCourse[g.cours] = []
            chargesByCourse[g.cours].push(c)
        }
    })

    const [expandedDisplayCourses, setExpandedDisplayCourses] = useState<Record<string, boolean>>({})

    const toggleDisplayCourse = (courseId: string, ev: React.MouseEvent) => {
        ev.stopPropagation()
        setExpandedDisplayCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }))
    }

    return <td 
        key={enseignant.id} 
        onContextMenu={openMenu} 
        style={{...style, position: "relative", transition: "all 0.2s"}}
        data-dropzone="charge"
        data-enseignant-id={enseignant.id}
        onDrop={dropHandlerCharge}
        onDragOver={dragOverHandlerCharge}
        onDragEnter={dragEnter}
        onDragLeave={dragLeave}
    >
        {Object.keys(chargesByCourse).sort((a, b) => {
            const courA = cours?.find(c => c.id == a)
            const courB = cours?.find(c => c.id == b)
            return (courA?.sigle || "").localeCompare(courB?.sigle || "")
        }).map(courseId => {
            const courseCharges = chargesByCourse[courseId]
            const cour = cours?.find(c => c.id == courseId)
            const isExpanded = expandedDisplayCourses[courseId]
            const courseColor = cour?.couleur || "#0dcaf0"
            
            return <div 
                key={courseId} 
                className="mb-2 rounded shadow-sm overflow-hidden" 
                style={{ border: "1px solid #ddd", borderLeft: `6px solid ${courseColor}`, backgroundColor: "white", display: "block", cursor: "grab" }}
                draggable="true"
                onDragStart={(ev) => {
                    ev.dataTransfer.setData("courseId", courseId)
                    ev.dataTransfer.setData("enseignantId", enseignant.id)
                }}
            >
                <div 
                    className="d-flex justify-content-between align-items-center cursor-pointer p-2" 
                    onClick={(e) => toggleDisplayCourse(courseId, e)}
                    style={{ fontSize: "0.8rem", cursor: "pointer" }}
                >
                    <div style={{ lineHeight: "1.2" }}>
                        <span style={{ fontWeight: "bold", color: "#333" }}>{cour?.sigle}</span>
                        <span className="text-muted ms-2" style={{ fontSize: "0.75rem" }}>({courseCharges.length} {courseCharges.length > 1 ? "groupes" : "groupe"})</span>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "#666" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
                {isExpanded && (
                    <div className="p-2 pt-0">
                        <div className="ps-2 border-start" style={{ borderColor: "#eee" }}>
                            {courseCharges.map(charge => {
                                const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
                                if(!groupe || !cour) return null
                                return <Charge key={charge.id} session={session} charge={charge} groupe={groupe} cours={cour} charges={charges} enseignantId={enseignant.id} onRemove={removeHandlerCharge} scenario={scenario}/>
                            })}
                        </div>
                    </div>
                )}
            </div>
        })}
        
        {mounted && menuContent && createPortal(menuContent, document.body)}

        <InputModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={addHandlerCharge}
            title="Ajouter une charge"
            label={`Nombre de semaines pour ${selectedGroupe ? cours?.find(c => c.id === selectedGroupe.cours)?.sigle : ''} :`}
            defaultValue={currentGroupeMax}
            max={currentGroupeMax}
        />
    </td>
}
