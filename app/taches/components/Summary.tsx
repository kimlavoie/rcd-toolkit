import { calculateSessionCI } from "@/app/utilities/ciHelpers"
import { getCIColor } from "@/app/constants/ciConfig"
import { useData } from "./DataContext"
import StickyHeader from "./ui/StickyHeader"
import StickyCell from "./ui/StickyCell"

export default function({visibleEnseignants, sessions, saison, firstColWidth, enseignantWidth, scenario = "production"}:any){
    const data = useData()
    const { CIReelles } = data

    // Safety check for sessions array
    if (!sessions || sessions.length < 2) {
        return null;
    }

    return <>
                <tr className="table-dark">
                    <StickyHeader 
                        isFirstCol 
                        zIndex={103} 
                        bottom="0"
                        style={{
                            backgroundColor: "#212529",
                            boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
                            borderRight: "2px solid #444",
                            fontSize: "0.8rem",
                            width: "1px"
                        }}
                        className="fw-bold"
                    >
                        CI Annuelle (Total)
                    </StickyHeader>
                    { visibleEnseignants.map((enseignant: any) => {
                        const enseignantId = String(enseignant.id);

                        const CIReelleExistante = (CIReelles ?? []).find(ci => String(ci.enseignant) === enseignantId && ci.session === sessions[0]);

                        const CIA = saison === "Hiver" ? CIReelleExistante?.CI ?? 0 : calculateSessionCI(enseignantId, sessions[0], data, scenario);
                        const CIH = calculateSessionCI(enseignantId, sessions[1], data, scenario);
                        const CI = CIA + CIH;
                        
                        const couleur = getCIColor(CI, 'annual')
                        
                        return <StickyCell 
                            key={enseignant.id} 
                            bottom="0" 
                            zIndex={102}
                            style={{
                                color: couleur, 
                                fontWeight: "bold", 
                                backgroundColor: "#212529", 
                                textAlign: "center", 
                                minWidth: `${enseignantWidth}px`, 
                                width: `${enseignantWidth}px`, 
                                fontSize: "0.9rem"
                            }}
                        >
                            {CI.toFixed(2)}
                        </StickyCell>
                    })}
                </tr>
    </>
}
