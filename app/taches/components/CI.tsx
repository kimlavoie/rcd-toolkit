'use client'
import { getCIColor } from "@/app/constants/ciConfig"
import StickyCell from "./ui/StickyCell"
import { useCICalculation } from "@/app/hooks/useCICalculation"

export default function({enseignant, session, trigger, scenario = "production", style, bottom = "auto", top = "auto"}: any){
    const enseignantId = String(enseignant.id)
    const CI = useCICalculation(enseignantId, session, scenario)
    const couleur = getCIColor(CI, 'session')

    return <StickyCell 
        className="text-center font-weight-bold" 
        bottom={bottom} 
        top={top} 
        zIndex={top !== "auto" ? 104 : 102}
        style={{
            ...style,
            color: couleur,
            backgroundColor: "#f8f9fa",
            boxShadow: top !== "auto" ? "0 2px 5px rgba(0,0,0,0.05)" : "0 -2px 5px rgba(0,0,0,0.05)",
            borderBottom: top !== "auto" ? "2px solid #dee2e6" : style?.borderBottom,
            borderTop: bottom !== "auto" ? "1px solid #dee2e6" : "none"
        }}
    >
        {CI.toFixed(2)}
    </StickyCell>
}
