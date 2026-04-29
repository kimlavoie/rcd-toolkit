export default function({charge, groupe, cours, enseignantId, onRemove}: any){
    function dragStartHandler(ev: any){
        ev.dataTransfer.setData("groupeId", groupe.id)
        ev.dataTransfer.setData("enseignantId", enseignantId)
    }

    return <div style={{border: "1px solid black", backgroundColor: cours.couleur}} draggable="true" onDragStart={dragStartHandler}>      
        <p style={{fontWeight: "bold"}}><button onClick={ev => onRemove(groupe.id, enseignantId)}>X</button> {cours.sigle}</p>
        <p><span style={{fontWeight: "bold"}}>{cours.nom}</span> ({groupe.nbEtudiants})</p>
        <p>Semaines: [{charge.nbSemaines}/15]</p> 
        <p></p>
    </div>
}