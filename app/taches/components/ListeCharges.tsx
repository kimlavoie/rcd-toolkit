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
        }
    }

    function dragOverHandlerCharge(ev: any) {
        ev.preventDefault()
    }

    async function dropHandlerCharge(ev: any) {
        ev.currentTarget.style.boxShadow = ""
        ev.currentTarget.style.backgroundColor = ""
        const idNouveauEnseignant = ev.currentTarget.dataset.enseignantId

        if (!idNouveauEnseignant) return

        const idGroupe = ev.dataTransfer.getData("groupeId")
        const idAncienEnseignant = ev.dataTransfer.getData("enseignantId")

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
                minWidth: "200px",
                border: "1px solid #444"
            }}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Ajouter un cours</p>
            {groupes?.filter(groupe => {
                if(groupe.session != session) return false
                const charge = charges?.find(charge => charge.groupe == groupe.id && charge.enseignant == enseignant.id)
                if(charge) return false
                const totalCharges = charges?.filter(charge => charge.groupe == groupe.id).reduce((somme, charge) => somme + (charge.nbSemaines ?? 0), 0)
                if(15 - (totalCharges ?? 0) < 0.001) return false
                return true
            }).map(groupe => {
                const cour = cours?.find(c => c.id == groupe.cours)
                return <p key={groupe.id} className="mb-1">
                    <button className="btn btn-outline-light btn-sm w-100 text-start" onClick={() => {setSelectedGroupe(groupe); setModalOpen(true)}}>
                        {cour?.sigle} (Gr. {groupe.id.substring(0,4)})
                    </button>
                </p>
            })}
        </div>
    )

    const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
    const groupesSession = groupes?.filter(groupe => groupe.session == session)
    const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))

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
        {chargesSession?.map(charge => {
            const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
            const cour = cours?.find(c => c.id == groupe?.cours)
            if(!groupe || !cour) return null
            return <Charge key={charge.id} session={session} charge={charge} groupe={groupe} cours={cour} charges={charges} enseignantId={enseignant.id} onRemove={removeHandlerCharge} scenario={scenario}/>
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
