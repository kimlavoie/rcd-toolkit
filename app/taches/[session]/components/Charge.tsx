import { firebaseDb } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import InputModal from "./InputModal"
import TransferModal from "./TransferModal"
import { toast } from "react-hot-toast"

export default function({session, charge, groupe, cours, charges, enseignantId, onRemove}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [transferModalOpen, setTransferModalOpen] = useState(false)

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

    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    function openMenu(ev: any){
        ev.preventDefault()
        ev.stopPropagation()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    function supprimer(ev: any){
        onRemove(groupe.id, enseignantId)
        setHideMenu(true)
        
    }

    const chargesGroupe = charges?.filter((c: any) => c.groupe == groupe.id)
    const sommeCharges = chargesGroupe?.reduce((somme: number, c: any) => somme + (c.nbSemaines ?? 0), 0)
    const semainesMax = 15 - (sommeCharges ?? 0) + (charge.nbSemaines ?? 0)

    async function handleSemainesConfirm(quantite: number){
        const nouvelleCharge = {nbSemaines: quantite}
        await firebaseDb.charges.update(charge.id, nouvelleCharge)
    }

    async function handleTransferConfirm(targetEnseignantId: string){
        const chargeExiste = charges?.find((c: any) => c.enseignant == targetEnseignantId && c.groupe == groupe.id)
        if(chargeExiste){
            toast.error("Cet enseignant a deja cette charge")
            return
        }

        await firebaseDb.charges.update(charge.id, {enseignant: targetEnseignantId})
        toast.success("Charge transférée avec succès")
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
                minWidth: "200px"
            }}
        >
            <p className="mb-2"><button className="btn btn-danger btn-sm w-100" onClick={supprimer}>Supprimer</button></p>
            <p className="mb-2"><button className="btn btn-primary btn-sm w-100" onClick={() => { setTransferModalOpen(true); setHideMenu(true); }}>Transférer à...</button></p>
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={() => { setModalOpen(true); setHideMenu(true); }}>Changer les semaines</button></p>
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={ev => window.open("/admin/cours?highlight=" + cours.id, "_blank")}>Modifier le cours</button></p>
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={ev => window.open("/admin/groupes/" + session + "?highlight=" + groupe.id, "_blank")}>Modifier le groupe</button></p>
        </div>
    )

    return <div 
        onContextMenu={openMenu} 
        style={{
            border: `1px solid #ddd`, 
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
            ev.currentTarget.style.borderTopColor = "#bbb";
            ev.currentTarget.style.borderRightColor = "#bbb";
            ev.currentTarget.style.borderBottomColor = "#bbb";
        }}
        onMouseLeave={ev => {
            ev.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            ev.currentTarget.style.borderTopColor = "#ddd";
            ev.currentTarget.style.borderRightColor = "#ddd";
            ev.currentTarget.style.borderBottomColor = "#ddd";
        }}
        draggable="true" 
        onDragStart={dragStartHandler}
    >      
        <div className="d-flex justify-content-between align-items-start mb-1">
            <span style={{fontWeight: "bold", color: "#333"}}>{cours.sigle}</span>
            <span className="badge bg-light text-dark border" style={{fontSize: "0.7rem"}}>Gr. {groupe.nbEtudiants} étud.</span>
        </div>
        <div style={{color: "#555", fontSize: "0.85rem", lineHeight: "1.2", marginBottom: "4px"}}>{cours.nom}</div>
        
        {charge.nbSemaines < 15 && (
            <div className="mt-2 text-muted" style={{fontSize: "0.75rem"}}>
                <span className="badge bg-warning text-dark">Partiel: {charge.nbSemaines}/15 sem.</span>
            </div>
        )}
        
        {mounted && menuContent && createPortal(menuContent, document.body)}

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
