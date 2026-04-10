interface Groupe {
    sigle: string
    etudiants: number
    heures: number
}

interface Liberation {
    qte: number
    [key: string]: any
}

function coursUniques(groupes:Array<Groupe>){
    return  groupes.filter((groupe, index, self) => 
        index === self.findIndex((u) => u.sigle === groupe.sigle)
      );
}

function calculerNbPrep(groupes:Array<Groupe>){
    const length = coursUniques(groupes).length
    return length < 3 ? 0.9 : (length < 4 ? 1.1 : 1.75)
}

function somme(tableau: Array<number>){
    return tableau.reduce((acc, n) => acc + n, 0)
}

export default function(groupes: Array<Groupe>, liberations: Array<Liberation>){
    

    const facteurPreparation = calculerNbPrep(groupes)
    const facteurPrestation = 1.2
    const facteurPES = 0.04
    


    let vueCI:any = {} //define later
    vueCI.groupes = groupes.map((groupe, index, self) => {
        const notSeen = index === self.findIndex((u) => u.sigle === groupe.sigle)
        const preparation = notSeen ? groupe.heures * facteurPreparation : 0
        const prestation = groupe.heures * facteurPrestation
        const PES = groupe.heures * groupe.etudiants * facteurPES
        const CI = preparation + prestation + PES

        return { ...groupe, preparation, prestation, PES, CI }
    })

    vueCI.sommes = {}

    vueCI.sommes.etudiants = somme(groupes.map((groupe) => groupe.etudiants))
    vueCI.sommes.heures = somme(groupes.map((groupe) => groupe.heures))
    vueCI.sommes.preparations = somme(vueCI.groupes.map((groupe:any) => groupe.preparation))
    vueCI.sommes.prestations = somme(vueCI.groupes.map((groupe:any) => groupe.prestation))
    vueCI.sommes.PES = somme(vueCI.groupes.map((groupe:any) => groupe.PES))
    vueCI.sommes.total = somme(vueCI.groupes.map((groupe:any) => groupe.CI))

    const sommePES = somme(groupes.map((groupe) => groupe.etudiants * groupe.heures))

    vueCI.exceptions = {}

    vueCI.exceptions.PES415 = sommePES > 415 ? (sommePES - 415) * 0.03 : 0
    vueCI.exceptions.NES160 = vueCI.sommes.etudiants > 160 ? ((vueCI.sommes.etudiants - 160) ** 2 ) * 0.1 : 0
    vueCI.exceptions.NES75 = vueCI.sommes.etudiants >= 75 ? vueCI.sommes.etudiants * 0.01 : 0
    vueCI.exceptions.liberations = somme(liberations.map((lib) => lib.qte)) * 40

    vueCI.total = vueCI.sommes.liberations + 
        vueCI.sommes.preparations + 
        vueCI.sommes.prestations + 
        vueCI.sommes.PES + 
        vueCI.exceptions.PES415 + 
        vueCI.exceptions.NES160 + 
        vueCI.exceptions.NES75

    return vueCI
}

export type {Groupe, Liberation}