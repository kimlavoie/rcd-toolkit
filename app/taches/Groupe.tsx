export default function({groupe, enseignantId, onRemove}: any){
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    return <div style={{border: "1px solid black"}} draggable="true" onDragStart={dragStartHandler}>      
        {groupe.sigle} - {groupe.titre} ({groupe.etudiants}) <button onClick={ev => onRemove(groupe.id, enseignantId)}>X</button>
    </div>
}