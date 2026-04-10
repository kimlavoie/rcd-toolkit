import calculateur, { Groupe, Liberation } from "../calculateur"

const groupes: Array<Groupe> = [
    {
        sigle: "420-JQA-JQ",
        etudiants: 50,
        heures: 3,
    },
    {
        sigle: "420-JQA-JQ",
        etudiants: 50,
        heures: 3,
    },
    {
        sigle: "420-ZGA-JQ",
        etudiants: 50,
        heures: 4,
    },
    {
        sigle: "420-JKA-JQ",
        etudiants: 15,
        heures: 5,
    },
]

const liberations: Array<Liberation> = [
    {
        qte: 0.1
    },
    {
        qte: 0.2
    },
    {
        qte: 0.2
    },
]

export default function(){
    const resultat = calculateur(groupes, liberations, 2)
    console.log(resultat)
    return <>
        <table className="table table-striped table-hover">
            <thead className="thead-light">
                <tr>
                    <th>Cours</th>
                    <th>Étudiants</th>
                    <th>Heures</th>
                    <th>Préparation</th>
                    <th>Prestation</th>
                    <th>PES</th>
                    <th>CI</th>
                </tr>
            </thead>
            <tbody>
                {resultat.groupes.map((groupe:any, index: number) => 
                    <tr key={index}>
                        <th>{groupe.sigle}</th>
                        <td>{groupe.etudiants}</td>
                        <td>{groupe.heures}</td>
                        <td>{groupe.preparation.toFixed(2)}</td>
                        <td>{groupe.prestation.toFixed(2)}</td>
                        <td>{groupe.PES.toFixed(2)}</td>
                        <th>{groupe.CI.toFixed(2)}</th>
                    </tr>
                )}
                
            </tbody>
            <tfoot>
                <tr>
                    <th>Total</th>
                    <th>{resultat.sommes.etudiants.toFixed(2)}</th>
                    <th>{resultat.sommes.heures.toFixed(2)}</th>
                    <th>{resultat.sommes.preparations.toFixed(2)}</th>
                    <th>{resultat.sommes.prestations.toFixed(2)}</th>
                    <th>{resultat.sommes.PES.toFixed(2)}</th>
                    <th>{resultat.sommes.total.toFixed(2)}</th>
                </tr>         
            </tfoot>
        </table>
        <table className="table" style={{width: "auto"}}>
            <tbody>
                <tr>
                    <th>PES &gt; 415</th>
                    <td>{resultat.exceptions.PES415.toFixed(2)}</td>
                </tr>
                <tr>
                    <th>NES &gt; 160</th>
                    <td>{resultat.exceptions.NES160.toFixed(2)}</td>
                </tr>
                <tr>
                    <th>NES &ge; 75</th>
                    <td>{resultat.exceptions.NES75.toFixed(2)}</td>
                </tr>
                <tr>
                    <th>Libération</th>
                    <td>{resultat.exceptions.liberations.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <h1>CI totale: {resultat.total}</h1>
    </>
}