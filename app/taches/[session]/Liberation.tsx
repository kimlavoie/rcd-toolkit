export default function({liberation, allocation, enseignantId, onRemove}: any){
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("liberationId", liberation.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    return <div style={{border: "1px solid black"}} draggable="true" onDragStart={dragStartHandler}>      
        <p>{allocation.code} - {allocation.description}</p>
        <p>({liberation.quantite}/{allocation.quantite}) <button onClick={ev => onRemove(liberation.id, enseignantId)}>X</button></p>  
    </div>
}