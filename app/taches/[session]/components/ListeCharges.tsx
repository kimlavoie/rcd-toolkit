import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Charge from "./Charge";
import InputModal from "./InputModal"
import type { Groupe, Charge as ChargeType, Cours } from "@/app/db/db"

export default function({enseignant, session}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedGroupe, setSelectedGroupe] = useState<any>(null)

    const groupes = useFirestoreCollection<Groupe>("groupes")
    const charges = useFirestoreCollection<ChargeType>("charges")
    const cours = useFirestoreCollection<Cours>("cours")

    const groupesSession = groupes?.filter((groupe: any) => groupe.session == session)
    const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)

    useEffect(() => {
        setMounted(true)
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setHideMenu(true);
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

    function openMenu(ev: any) {
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    function startNewSelectionGroupe(groupe: any) {
        setSelectedGroupe(groupe)
        setModalOpen(true)
        setHideMenu(true)
    }

    const currentGroupeMax = selectedGroupe ? (() => {
        const chargesGroupe = charges?.filter(charge => charge.groupe == selectedGroupe.id)
        const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
        return 15 - (sommeCharges ?? 0)
    })() : 15

    async function handleAddChargeConfirm(quantite: number){
        if (!selectedGroupe) return

        const charge = {
            enseignant: enseignant.id,
            groupe: selectedGroupe.id,
            nbSemaines: quantite
        }

        await firebaseDb.charges.add(charge)
        setSelectedGroupe(null)
    }

    async function dropHandlerGroupe(ev:any){
        ev.currentTarget.style.boxShadow = "inset 0 0 0 0"
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId

        if(!idNouveauEnseignant){
            return
        }

        const idGroupe = ev.dataTransfer.getData("groupeId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

        const ancienneCharge = charges?.find(charge => charge.enseignant == idAncienEnseignant && charge.groupe == idGroupe)

        const chargeExiste = charges?.find(charge => charge.enseignant == idNouveauEnseignant && charge.groupe == idGroupe)
        
        if(chargeExiste){
            alert("Cet enseignant a deja cette charge")
            return
        }

        const nouvelleCharge = {
            enseignant: idNouveauEnseignant,
            groupe: idGroupe,
            nbSemaines: ancienneCharge?.nbSemaines ?? 0
        }

        await firebaseDb.charges.add(nouvelleCharge)
        if (ancienneCharge) {
            await firebaseDb.charges.delete(ancienneCharge.id)
        }
    }

    async function removeHandlerGroupe(groupeId:any, enseignantId:any){
        const charge = charges?.find(charge => charge.enseignant == enseignantId && charge.groupe == groupeId)
        if (charge) {
            await firebaseDb.charges.delete(charge.id)
        }
    }

    function dragOverHandlerGroupe(ev:any){
        ev.preventDefault()
    }

    function dragEnter(ev:any){
        if(ev.currentTarget.dataset.dropzone == "charge" && ev.dataTransfer.types.includes("groupeid")){
            ev.currentTarget.style.boxShadow = "inset 0 0 0 2px red"
        }
    }
    
    function dragLeave(ev:any){
        if(!ev.currentTarget.contains(ev.relatedTarget)){
            ev.currentTarget.style.boxShadow = "inset 0 0 0 0"
        }
    }

    const menuContent = !hideMenu && (
        <div 
            ref={menuRef}
            style={{
                position: "fixed", 
                left: position.left, 
                top: position.top, 
                backgroundColor: "#444", 
                color: "white",
                display: "block", 
                padding: "10px", 
                zIndex: 9999,
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                minWidth: "200px",
                maxHeight: "300px",
                overflowY: "auto"
            }}
        >
            <h6 className="border-bottom pb-1 mb-2 text-info">Ajouter un groupe</h6>
            {groupesSession?.filter((groupe:any) => {
                const chargesGroupe = charges?.filter(charge => charge.groupe == groupe.id)
                const sommeCharges = chargesGroupe?.reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
                const chargeExiste = charges?.find(charge => charge.enseignant == enseignant.id && charge.groupe == groupe.id)
                return (sommeCharges ?? 0) < 15 && !chargeExiste
            })?.toSorted((a:any, b:any) => {
                const coursA = cours?.find(cour => cour.id == a.cours)
                const coursB = cours?.find(cour => cour.id == b.cours)
                return (coursA?.sigle ?? "").localeCompare(coursB?.sigle ?? "")
            })?.map((groupe: any, index:number) => {
                const cour = cours?.find(cour => cour.id == groupe.cours)
                return <p key={index} className="mb-1">
                    <button className="btn btn-sm btn-outline-light w-100 text-start" onClick={() => startNewSelectionGroupe(groupe)}>
                        {cour?.sigle} - {cour?.nom} ({groupe.nbEtudiants})
                    </button>
                </p>
            })}
            {groupesSession?.length === 0 && <p className="small text-muted mb-0">Aucun groupe disponible</p>}
        </div>
    )

    return <>
        <td onContextMenu={openMenu} key={enseignant.id} data-dropzone="charge" data-enseignant-id={enseignant.id} onDrop={dropHandlerGroupe} onDragOver={dragOverHandlerGroupe} onDragEnter={dragEnter} onDragLeave={dragLeave} style={{paddingBottom: "50px", position: "relative"}}>
            {chargesEnseignant?.filter(charge => {
                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                return groupe?.session == session
            })?.map((charge: any) => {
                const groupe = groupes?.find(groupe => charge.groupe == groupe.id)
                const cour = cours?.find(cour => groupe?.cours == cour.id)
                return <Charge key={groupe?.id} session={session} charge={charge} groupe={groupe} cours={cour} charges={charges} enseignantId={enseignant.id} onRemove={removeHandlerGroupe}/>
            })}
            
            {mounted && menuContent && createPortal(menuContent, document.body)}

            <InputModal 
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedGroupe(null); }}
                onConfirm={handleAddChargeConfirm}
                title="Ajouter une charge"
                label={`Nombre de semaines pour ${selectedGroupe ? cours?.find(c => c.id === selectedGroupe.cours)?.sigle : ''} :`}
                defaultValue={currentGroupeMax}
                max={currentGroupeMax}
            />
        </td>
    </>
}