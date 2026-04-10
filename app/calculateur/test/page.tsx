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
    const resultat = calculateur(groupes, liberations)
    return <>
        <table>
            <thead>
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
                        <td>{groupe.CI.toFixed(2)}</td>
                    </tr>
                )}
                
            </tbody>
            <tfoot>
                <tr>
                    <th>Total</th>
                    <td>{resultat.sommes.etudiants.toFixed(2)}</td>
                    <td>{resultat.sommes.heures.toFixed(2)}</td>
                    <td>{resultat.sommes.preparations.toFixed(2)}</td>
                    <td>{resultat.sommes.prestations.toFixed(2)}</td>
                    <td>{resultat.sommes.PES.toFixed(2)}</td>
                    <td>{resultat.sommes.total.toFixed(2)}</td>
                </tr>         
            </tfoot>
        </table>
        <table>
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
    </>
}