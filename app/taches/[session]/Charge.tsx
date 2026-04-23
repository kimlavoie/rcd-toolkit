export default function({charge, groupe, cours, enseignantId, onRemove}: any){
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    return <div style={{border: "1px solid black"}} draggable="true" onDragStart={dragStartHandler}>      
        {cours.sigle} - {cours.nom} ({groupe.nbEtudiants}) [{charge.nbSemaines}/15] <button onClick={ev => onRemove(groupe.id, enseignantId)}>X</button>
    </div>
}