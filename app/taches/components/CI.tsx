'use client'
import { firebaseDb } from "@/app/utilities/firebaseDb"
import { calculateSessionCI } from "@/app/utilities/ciHelpers"
import { getCIColor } from "@/app/constants/ciConfig"
import { useData } from "./DataContext"
import StickyCell from "./ui/StickyCell"

export default function({enseignant, session, trigger, scenario = "production", style, bottom = "auto", top = "auto"}: any){
    const data = useData()
    const { CIReelles } = data
    
    const enseignantId = String(enseignant.id)

    // Si on est en mode Hiver (dans CIReelle), on affiche la CI réelle d'automne + calcul d'hiver
    // Cependant ce composant est utilisé pour le calcul dynamique d'une session précise
    const CI = calculateSessionCI(enseignantId, session, data, scenario)
    const couleur = getCIColor(CI, 'session')

    return <StickyCell 
        className="text-center font-weight-bold" 
        bottom={bottom} 
        top={top} 
        zIndex={top !== "auto" ? 104 : 102}
        style={{
            ...style,
            color: couleur,
            backgroundColor: "white",
            boxShadow: top !== "auto" ? "0 2px 5px rgba(0,0,0,0.05)" : "0 -2px 5px rgba(0,0,0,0.05)",
            borderBottom: top !== "auto" ? "2px solid #dee2e6" : style?.borderBottom,
            borderTop: bottom !== "auto" ? "1px solid #dee2e6" : "none"
        }}
    >
        {CI.toFixed(2)}
    </StickyCell>
}
