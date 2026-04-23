export default function({liberation, allocation, enseignantId, onRemove}: any){
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("liberationId", liberation.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    return <div style={{border: "1px solid black"}} draggable="true" onDragStart={dragStartHandler}>      
        {allocation.code} - {allocation.description} ({liberation.quantite}/{allocation.quantite}) <button onClick={ev => onRemove(liberation.id, enseignantId)}>X</button>
    </div>
}