'use client'
import { calculateSessionCI } from "@/app/utilities/ciHelpers"
import { getCIColor } from "@/app/constants/ciConfig"
import { useData } from "./DataContext"
import StickyCell from "./ui/StickyCell"

export default function CI({enseignant, session, scenario = "production", style, bottom, top}: any){
    const data = useData()

    const CI = calculateSessionCI(enseignant.id, session, data, scenario)

    const color = getCIColor(CI, 'session')

    return <StickyCell 
        className="text-center font-weight-bold" 
        bottom={bottom} 
        top={top} 
        zIndex={top ? 104 : 102}
        style={{
            ...style,
            color,
            backgroundColor: "white",
            boxShadow: top ? "0 2px 5px rgba(0,0,0,0.05)" : "0 -2px 5px rgba(0,0,0,0.05)",
            borderBottom: top ? "2px solid #dee2e6" : style?.borderBottom
        }}
    >
        {CI.toFixed(2)}
    </StickyCell>
}
