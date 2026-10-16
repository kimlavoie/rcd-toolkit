export function extractSessionInfos(code:string){
    const saison = code.substring(0,1) == "A" ? "Automne" : "Hiver"
    const annee = `20${code.substring(1,3)}`
    return {saison, annee}
}

export function makeSessionCode(saison:string, annee:string){
    return saison.substring(0,1).toUpperCase() + annee.substring(2,4)
}

export interface CorrespondingSessions {
    currentSaison: "Automne" | "Hiver"
    autumnSession: string
    winterSession: string
    autumnYear: string
    winterYear: string
    academicYear: string
    oppositeSession: string
}

export function getCorrespondingSessions(sessionCode: string): CorrespondingSessions {
    const { saison, annee } = extractSessionInfos(sessionCode)
    const yearNum = parseInt(annee, 10)

    if (saison === "Automne") {
        const winterYearNum = yearNum + 1
        const winterYear = String(winterYearNum)
        const winterSession = makeSessionCode("Hiver", winterYear)
        return {
            currentSaison: "Automne",
            autumnSession: sessionCode,
            winterSession,
            autumnYear: annee,
            winterYear,
            academicYear: `${annee}-${winterYear}`,
            oppositeSession: winterSession
        }
    } else {
        const autumnYearNum = yearNum - 1
        const autumnYear = String(autumnYearNum)
        const autumnSession = makeSessionCode("Automne", autumnYear)
        return {
            currentSaison: "Hiver",
            autumnSession,
            winterSession: sessionCode,
            autumnYear,
            winterYear: annee,
            academicYear: `${autumnYear}-${annee}`,
            oppositeSession: autumnSession
        }
    }
}