import { useState } from "react"
import calculerCI from "../calculerCI"

export default function({enseignant, session}: any){
    const [CI, setCI] = useState(0)

    calculerCI(session, enseignant).then(setCI)
    
    const couleur = CI < 30 ? "black" : CI < 40 ? "darkkhaki" : CI < 45 ? "green" : CI < 55 ? "orange" : "red" 

    return <th key={enseignant.id} style={{color: couleur}}>
        {CI.toFixed(2)}
    </th>
}