import { useState } from "react"

export default function Enseignant({enseignant, onCache}: any){
    const [hideMenu, setHideMenu] = useState(true)

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
    }

    return <th onContextMenu={openMenu} onMouseLeave={ev => {setHideMenu(true)}} style={{position: "sticky", zIndex: 100, top: "0", color: "black", backgroundColor: "lightgray"}} key={enseignant.id}>
        <p>{enseignant.prenom} {enseignant.nom}</p>
        <div style={{position: "absolute", zIndex: 101, backgroundColor: "darkgrey", display: "block", padding: "5px"}} hidden={hideMenu}>
            <button onClick={() => onCache()}>Cacher</button>
        </div>
    </th>
    
}