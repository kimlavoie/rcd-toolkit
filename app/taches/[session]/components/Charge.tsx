import { firebaseDb } from "@/app/utilities/firebaseDb"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import InputModal from "./InputModal"

export default function({session, charge, groupe, cours, charges, enseignantId, onRemove}: any){
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
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={() => { setModalOpen(true); setHideMenu(true); }}>Changer les semaines</button></p>
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={ev => window.open("/admin/cours?highlight=" + cours.id, "_blank")}>Modifier le cours</button></p>
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={ev => window.open("/admin/groupes/" + session + "?highlight=" + groupe.id, "_blank")}>Modifier le groupe</button></p>
        </div>
    )

    return <div onContextMenu={openMenu} onMouseLeave={ev => {ev.currentTarget.style.boxShadow = "inset 0 0 0 0"}} onMouseEnter={ev => ev.currentTarget.style.boxShadow = "inset 0 0 0 2px red"} style={{border: `1px solid black`, backgroundColor: cours.couleur, padding: `5px`, marginBottom: "4px"}} draggable="true" onDragStart={dragStartHandler}>      
        <p style={{fontWeight: "bold"}}>{cours.sigle}</p>
        <p><span style={{fontWeight: "bold"}}>{cours.nom}</span> ({groupe.nbEtudiants})</p>
        {charge.nbSemaines < 15 && <p>Semaines: [{charge.nbSemaines}/15]</p> }
        
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
    </div>
}