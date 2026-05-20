import { firebaseDb } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import InputModal from "./InputModal"

export default function({session, liberation, allocation, liberations, enseignantId, onRemove}: any){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

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
        ev.dataTransfer.setData("liberationId", liberation.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    function openMenu(ev: any){
        ev.preventDefault()
        ev.stopPropagation()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    function supprimer(ev: any){
        onRemove(liberation.id, enseignantId)
        setHideMenu(true)
        
    }

    const liberationsAllocation = liberations?.filter((l: any) => l.allocation == allocation?.id)
    const sommeLiberations = liberationsAllocation?.reduce((somme: number, l: any) => somme + (l.quantite ?? 0), 0)
    const qteMax = Number(((allocation?.quantite ?? 0) - (sommeLiberations ?? 0) + (liberation.quantite ?? 0)).toFixed(3))

    async function handleQuantiteConfirm(quantite: number){
        const nouvelleLiberation = {quantite: quantite}
        await firebaseDb.liberations.update(liberation.id, nouvelleLiberation)
    }

    function modifierAllocation(ev: any){
        window.open("/admin/allocations/" + session + "?highlight=" + allocation.id, "_blank")
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
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={() => { setModalOpen(true); setHideMenu(true); }}>Changer la quantité</button></p>
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={modifierAllocation}>Modifier l'allocation</button></p>
        </div>
    )

    return <div 
        onContextMenu={openMenu} 
        style={{
            border: `1px solid #ddd`, 
            backgroundColor: "#fcf9ff", 
            borderLeft: `6px solid #6f42c1`,
            padding: `8px`, 
            marginBottom: "6px",
            borderRadius: "4px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            cursor: "grab",
            fontSize: "0.9rem",
            position: "relative",
            transition: "all 0.2s"
        }} 
        onMouseEnter={ev => {
            ev.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.12)";
            ev.currentTarget.style.borderTopColor = "#ccc";
            ev.currentTarget.style.borderRightColor = "#ccc";
            ev.currentTarget.style.borderBottomColor = "#ccc";
        }}
        onMouseLeave={ev => {
            ev.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            ev.currentTarget.style.borderTopColor = "#ddd";
            ev.currentTarget.style.borderRightColor = "#ddd";
            ev.currentTarget.style.borderBottomColor = "#ddd";
        }}
        draggable="true" 
        onDragStart={dragStartHandler}
    >      
        <div style={{fontWeight: "bold", color: "#444", marginBottom: "4px"}}>{allocation.code}</div>
        <div style={{color: "#666", fontSize: "0.85rem", lineHeight: "1.2", marginBottom: "8px"}}>{allocation.description}</div>
        
        <div className="d-flex justify-content-end">
            <span className="badge rounded-pill bg-primary" style={{fontSize: "0.7rem", opacity: 0.85}}>
                {liberation.quantite} / {allocation.quantite} ETC
            </span>
        </div>
        
        {mounted && menuContent && createPortal(menuContent, document.body)}

        <InputModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleQuantiteConfirm}
            title="Modifier la quantité"
            label={`Quantité de libération pour ${allocation.code} (en ETC) :`}
            defaultValue={liberation.quantite}
            max={qteMax}
            step={0.001}
        />
    </div>
}