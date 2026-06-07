'use client'

import { firebaseDb } from "@/app/utilities/firebaseDb"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import InputModal from "./InputModal"
import TransferModal from "./TransferModal"
import { toast } from "react-hot-toast"
import { getGroupColor } from "@/app/utilities/groupColors"
import { useContextMenu } from "@/app/utilities/hooks"

export default function Charge({session, charge, groupe, cours, charges, enseignantId, onRemove, scenario = "production", minimal = false}: any){
    const { isVisible, position, menuRef, openMenu, closeMenu } = useContextMenu()
    const [modalOpen, setModalOpen] = useState(false)
    const [transferModalOpen, setTransferModalOpen] = useState(false)

    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    function supprimer(){
        onRemove(groupe.id, enseignantId)
        closeMenu()
    }

    const chargesGroupe = charges?.filter((c: any) => c.groupe === groupe.id)
    const sommeCharges = chargesGroupe?.reduce((somme: number, c: any) => somme + (c.nbSemaines ?? 0), 0)
    const semainesMax = 15 - (sommeCharges ?? 0) + (charge.nbSemaines ?? 0)

    async function handleSemainesConfirm(quantite: number){
        await firebaseDb.charges.update(charge.id, {nbSemaines: quantite})
    }

    async function handleTypeChange(type: "T" | "P" | "TP"){
        await firebaseDb.charges.update(charge.id, {type})
        closeMenu()
    }

    async function handleTransferConfirm(targetEnseignantId: string){
        const chargeExiste = charges?.find((c: any) => c.enseignant === targetEnseignantId && c.groupe === groupe.id)
        if(chargeExiste){
            toast.error("Cet enseignant a deja cette charge")
            return
        }

        await firebaseDb.charges.update(charge.id, {enseignant: targetEnseignantId})
        toast.success("Charge transférée avec succès")
    }

    const menuContent = isVisible && (
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
                border: "1px solid #444",
                opacity: (position.left === 0 && position.top === 0) ? 0 : 1
            }}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Modifier le type</p>
            <div className="btn-group btn-group-sm w-100 mb-3">
                {(groupe.aTheorie ?? true) && (
                    <button className={`btn btn-sm ${charge.type === 'T' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleTypeChange('T')}>T</button>
                )}
                {(groupe.aPratique ?? true) && (
                    <button className={`btn btn-sm ${charge.type === 'P' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleTypeChange('P')}>P</button>
                )}
                {(groupe.aTheorie !== false && groupe.aPratique !== false) && (
                    <button className={`btn btn-sm ${charge.type === 'TP' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => handleTypeChange('TP')}>T+P</button>
                )}
            </div>

            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Actions</p>
            <p className="mb-2"><button className="btn btn-danger btn-sm w-100" onClick={supprimer}>Supprimer</button></p>
            <p className="mb-2"><button className="btn btn-primary btn-sm w-100" onClick={() => { setTransferModalOpen(true); closeMenu(); }}>Transférer à...</button></p>
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={() => { setModalOpen(true); closeMenu(); }}>Changer les semaines</button></p>
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={() => window.open("/admin/cours?highlight=" + cours.id, "_blank")}>Modifier le cours</button></p>
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={() => window.open("/admin/groupes/" + session + "?highlight=" + groupe.id, "_blank")}>Modifier le groupe</button></p>
        </div>
    )

    if (minimal) {
        return <div 
            onContextMenu={openMenu} 
            style={{
                border: `1px solid #eee`, 
                borderRight: `4px solid ${getGroupColor(groupe.id)}`,
                backgroundColor: "white", 
                padding: `4px 8px`, 
                marginBottom: "4px",
                borderRadius: "3px",
                cursor: "grab",
                fontSize: "0.75rem",
                position: "relative",
                transition: "all 0.2s"
            }} 
            draggable="true" 
            onDragStart={dragStartHandler}
        >      
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-dark" title={`${groupe.nbEtudiants} étudiants`}>
                        <span style={{fontSize: "0.7rem", opacity: 0.8, marginRight: "2px"}}>👤</span>{groupe.nbEtudiants}
                    </span>
                    {charge.type !== "TP" && (
                        <span className={`badge ${charge.type === 'T' ? 'bg-primary' : 'bg-success'}`} style={{fontSize: "0.6rem"}}>
                            {charge.type}
                        </span>
                    )}
                </div>
                {charge.nbSemaines < 14.999 && (
                    <span className="badge bg-warning text-dark px-1 py-0" style={{fontSize: "0.6rem"}}>{charge.nbSemaines} sem.</span>
                )}
            </div>
            
            {isVisible && createPortal(menuContent, document.body)}

            <InputModal 
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleSemainesConfirm}
                title="Modifier les semaines"
                label={`Nombre de semaines pour le cours ${cours.sigle} :`}
                defaultValue={charge.nbSemaines}
                max={semainesMax}
            />

            <TransferModal 
                isOpen={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                onConfirm={handleTransferConfirm}
                title={`Transférer ${cours.sigle}`}
                currentEnseignantId={enseignantId}
            />
        </div>
    }

    return <div 
        onContextMenu={openMenu} 
        style={{
            border: `1px solid #ddd`, 
            borderRight: `4px solid ${getGroupColor(groupe.id)}`,
            backgroundColor: "white", 
            borderLeft: `6px solid ${cours.couleur}`,
            padding: `8px`, 
            marginBottom: "6px",
            borderRadius: "4px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            cursor: "grab",
            fontSize: "0.9rem",
            position: "relative",
            transition: "all 0.2s"
        }} 
        onMouseEnter={ev => {
            ev.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.15)";
            ev.currentTarget.style.borderColor = "#bbb";
        }}
        onMouseLeave={ev => {
            ev.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            ev.currentTarget.style.borderColor = "#ddd";
        }}
        draggable="true" 
        onDragStart={dragStartHandler}
    >      
        <div className="d-flex justify-content-between align-items-start mb-1">
            <div className="d-flex align-items-center gap-2">
                <span style={{fontWeight: "bold", color: "#333"}}>{cours.sigle}</span>
                {charge.type !== "TP" && (
                    <span className={`badge ${charge.type === 'T' ? 'bg-primary' : 'bg-success'}`} style={{fontSize: "0.65rem"}}>
                        {charge.type}
                    </span>
                )}
            </div>
            <span className="text-dark extra-small fw-bold" style={{fontSize: "0.75rem"}}>
                <span style={{fontSize: "0.7rem", opacity: 0.8, marginRight: "2px"}}>👤</span>{groupe.nbEtudiants}
            </span>
        </div>
        <div style={{color: "#555", fontSize: "0.85rem", lineHeight: "1.2", marginBottom: "4px"}}>{cours.nom}</div>
        
        {charge.nbSemaines < 14.999 && (
            <div className="mt-2 text-muted" style={{fontSize: "0.75rem"}}>
                <span className="badge bg-warning text-dark">Partiel: {charge.nbSemaines}/15 sem.</span>
            </div>
        )}
        
        {isVisible && createPortal(menuContent, document.body)}

        <InputModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleSemainesConfirm}
            title="Modifier les semaines"
            label={`Nombre de semaines pour le cours ${cours.sigle} :`}
            defaultValue={charge.nbSemaines}
            max={semainesMax}
        />

        <TransferModal 
            isOpen={transferModalOpen}
            onClose={() => setTransferModalOpen(false)}
            onConfirm={handleTransferConfirm}
            title={`Transférer ${cours.sigle}`}
            currentEnseignantId={enseignantId}
        />
    </div>
}
