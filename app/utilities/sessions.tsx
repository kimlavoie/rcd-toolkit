export function extractSessionInfos(code:string){
    const saison = code.substring(0,1) == "A" ? "Automne" : "Hiver"
    const annee = `20${code.substring(1,3)}`
    return {saison, annee}
}

export function makeSessionCode(saison:string, annee:string){
    return saison.substring(0,1).toUpperCase() + annee.substring(2,4)
}