export default function({charge, groupe, cours, enseignantId, onRemove}: any){
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    return <div style={{border: "1px solid black", backgroundColor: cours.couleur}} draggable="true" onDragStart={dragStartHandler}>      
        <p>{cours.sigle}</p>
        <p>{cours.nom} ({groupe.nbEtudiants})</p>
        <p>Semaines: [{charge.nbSemaines}/15] <button onClick={ev => onRemove(groupe.id, enseignantId)}>X</button></p> 
    </div>
}