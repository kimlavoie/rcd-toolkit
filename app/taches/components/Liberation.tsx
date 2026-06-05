import { firebaseDb } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import InputModal from "./InputModal"
import TransferModal from "./TransferModal"
import { toast } from "react-hot-toast"

export default function({session, liberation, allocation, liberations, enseignantId, onRemove, scenario = "production"}: any){
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

    async function handleTransferConfirm(targetEnseignantId: string){
        const liberationExiste = liberations?.find((l: any) => l.enseignant == targetEnseignantId && l.allocation == allocation.id)
        if(liberationExiste){
            toast.error("Cet enseignant a deja cette liberation")
            return
        }

        await firebaseDb.liberations.update(liberation.id, {enseignant: targetEnseignantId})
        toast.success("Libération transférée avec succès")
    }

    function modifierAllocation(ev: any){
        window.open("/admin/allocations/" + session + "?highlight=" + allocation.id, "_blank")
    }

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
                border: "1px solid #444",
                opacity: (position.left === 0 && position.top === 0) ? 0 : 1 // Hide until positioned
            }}
        >
            <p className="mb-2"><button className="btn btn-danger btn-sm w-100" onClick={supprimer}>Supprimer</button></p>
            <p className="mb-2"><button className="btn btn-primary btn-sm w-100" onClick={() => { setTransferModalOpen(true); setHideMenu(true); }}>Transférer à...</button></p>
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={() => { setModalOpen(true); setHideMenu(true); }}>Changer la quantité</button></p>
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={modifierAllocation}>Modifier l'allocation</button></p>
        </div>
    )

    return <div 
        onContextMenu={openMenu} 
        style={{
            border: `1px solid #ddd`, 
            backgroundColor: "#fcf9ff", 
            borderLeft: `4px solid #6f42c1`,
            padding: `6px 8px`, 
            marginBottom: "4px",
            borderRadius: "4px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            cursor: "grab",
            fontSize: "0.8rem",
            position: "relative",
            transition: "all 0.2s"
        }} 
        onMouseEnter={ev => {
            ev.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            ev.currentTarget.style.borderColor = "#bbb";
        }}
        onMouseLeave={ev => {
            ev.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
            ev.currentTarget.style.borderColor = "#ddd";
        }}
        draggable="true" 
        onDragStart={dragStartHandler}
    >      
        <div className="w-100">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                <span style={{fontWeight: "bold", color: "#444"}}>{allocation.code}</span>
                <span className="badge rounded-pill bg-primary" style={{fontSize: "0.65rem", flexShrink: 0}}>
                    {liberation.quantite} ETC
                </span>
            </div>
            <div className="text-muted text-truncate d-none d-xl-block" style={{fontSize: "0.7rem", width: "100%"}} title={allocation.description}>
                {allocation.description}
            </div>
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

        <TransferModal 
            isOpen={transferModalOpen}
            onClose={() => setTransferModalOpen(false)}
            onConfirm={handleTransferConfirm}
            title={`Transférer ${allocation.code}`}
            currentEnseignantId={enseignantId}
        />
    </div>
}
