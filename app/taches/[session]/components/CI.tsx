'use client'

import { useState, useEffect } from "react"
import calculerCI from "../calculerCI"

export default function({enseignant, session, enseignantWidth, trigger}: any){
    const [CI, setCI] = useState(0)

    useEffect(() => {
        if (enseignant && session) {
            calculerCI(session, enseignant)
                .then(setCI)
                .catch(err => {
                    console.error("Erreur calcul CI:", err);
                    setCI(0);
                });
        }
    }, [session, enseignant, trigger])
    
    const couleur = CI < 30 ? "black" : CI < 40 ? "darkkhaki" : CI < 45 ? "green" : CI < 55 ? "orange" : "red" 

    return <th key={enseignant.id} style={{color: couleur, minWidth: `${enseignantWidth}px`, width: `${enseignantWidth}px`, textAlign: "center"}}>
        {CI ? CI.toFixed(2) : "0.00"}
    </th>
}