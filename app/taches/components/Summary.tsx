import { getCIColor } from "@/app/constants/ciConfig"
import StickyHeader from "./ui/StickyHeader"
import StickyCell from "./ui/StickyCell"
import { useTotalAnnualCI } from "@/app/hooks/useCICalculation"

function AnnualCICell({ enseignantId, sessions, saison, scenario, columnWidth, globalWidth, isPrinting }: any) {
    const CI = useTotalAnnualCI(enseignantId, sessions, saison, scenario);
    const couleur = getCIColor(CI, 'annual')
    const width = columnWidth || globalWidth || 200

    return <StickyCell
        bottom={isPrinting ? "auto" : "0"}
        zIndex={102}
        style={{
            color: couleur,
            fontWeight: "bold",
            backgroundColor: "#212529",
            textAlign: "center",
            minWidth: `${width}px`,
            width: `${width}px`,
            maxWidth: `${width}px`,
            overflow: "hidden",
            fontSize: "0.9rem"
        }}
    >
        {CI.toFixed(2)}
    </StickyCell>
}

export default function({visibleEnseignants, sessions, saison, firstColWidth, columnWidths, globalWidth, scenario = "production", isPrinting}:any){
    // Safety check for sessions array
    if (!sessions || sessions.length < 2) {
        return null;
    }

    return <>
                <tr className="table-dark">
                    <StickyHeader 
                        isFirstCol 
                        zIndex={103} 
                        bottom={isPrinting ? "auto" : "0"}
                        style={{
                            backgroundColor: "#212529",
                            boxShadow: isPrinting ? "none" : "2px 0 5px rgba(0,0,0,0.2)",
                            borderRight: "2px solid #444",
                            fontSize: "0.8rem",
                            width: "200px",
                            minWidth: "200px",
                            maxWidth: "200px"
                        }}
                        className="fw-bold"
                    >
                        CI Annuelle (Total)
                    </StickyHeader>
                    { visibleEnseignants.map((enseignant: any) => (
                        <AnnualCICell 
                            key={enseignant.id}
                            enseignantId={String(enseignant.id)}
                            sessions={sessions}
                            saison={saison}
                            scenario={scenario}
                            columnWidth={columnWidths?.[enseignant.id]}
                            globalWidth={globalWidth}
                            isPrinting={isPrinting}
                        />
                    ))}
                </tr>
    </>
}
