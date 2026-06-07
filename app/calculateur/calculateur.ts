interface Groupe {
    sigle: string
    etudiants: number
    heures: number
    semaines: number
    heuresTheorie?: number
    heuresPratique?: number
    type?: "T" | "P" | "TP"
}

interface Liberation {
    qte: number
}

interface SupervisionCalcul {
    nbStagiaires: number
    CIparStagiaire: number
    coordination: number
    pourcentageCoordination: number
}

interface GroupeCI extends Groupe {
    heuresEffectives: number
    preparation: number
    prestation: number
    PES: number
    CI: number
}

interface ResultatCI {
    groupes: GroupeCI[]
    sommes: {
        etudiants: number
        heures: number
        preparations: number
        prestations: number
        PES: number
        total: number
    }
    exceptions: {
        PES415: number
        NES160: number
        NES75: number
        liberations: number
        stages: number
    }
    total: number
}

function coursUniques(groupes: Array<Groupe>) {
    return groupes.filter((groupe, index, self) => 
        index === self.findIndex((u) => u.sigle === groupe.sigle)
    );
}

function calculerNbPrep(groupes: Array<Groupe>): number {
    const length = coursUniques(groupes).length
    if (length === 0) return 0
    return length < 3 ? 0.9 : (length < 4 ? 1.1 : 1.75)
}

function somme(tableau: Array<number>): number {
    return tableau.reduce((acc, n) => acc + (isNaN(n) ? 0 : n), 0)
}

export default function calculateur(
    groupes: Array<Groupe>, 
    liberations: Array<Liberation>, 
    supervisions: Array<SupervisionCalcul>
): ResultatCI {
    const facteurPreparation = calculerNbPrep(groupes)
    const facteurPrestation = 1.2
    const facteurPES = 0.04

    const groupesCI: GroupeCI[] = groupes.map((groupe, index, self) => {
        const notSeen = index === self.findIndex((u) => u.sigle === groupe.sigle)
        
        let heuresEquivalentes = Number(groupe.heures || 0)
        if (groupe.type === "T") {
            heuresEquivalentes = Number(groupe.heuresTheorie ?? (heuresEquivalentes * 0.5))
        } else if (groupe.type === "P") {
            heuresEquivalentes = Number(groupe.heuresPratique ?? (heuresEquivalentes * 0.5))
        }

        const etudiants = Number(groupe.etudiants || 0)
        const semaines = Number(groupe.semaines || 0)
        
        const preparation = notSeen ? heuresEquivalentes * facteurPreparation : 0
        const prestation = heuresEquivalentes * facteurPrestation
        const PES = heuresEquivalentes * etudiants * facteurPES
        const CI = (preparation + prestation + PES) * (semaines / 15)

        return { 
            ...groupe, 
            heuresEffectives: heuresEquivalentes, 
            preparation, 
            prestation, 
            PES, 
            CI: isNaN(CI) ? 0 : CI 
        }
    })

    const sommes = {
        etudiants: somme(groupes.map(g => Number(g.etudiants || 0))),
        heures: somme(groupesCI.map(g => g.heuresEffectives)),
        preparations: somme(groupesCI.map(g => g.preparation)),
        prestations: somme(groupesCI.map(g => g.prestation)),
        PES: somme(groupesCI.map(g => g.PES)),
        total: somme(groupesCI.map(g => g.CI))
    }

    const sommePES = somme(groupesCI.map(g => g.etudiants * g.heuresEffectives))

    const exceptions = {
        PES415: sommePES > 415 ? (sommePES - 415) * 0.03 : 0,
        NES160: sommes.etudiants > 160 ? ((sommes.etudiants - 160) ** 2) * 0.1 : 0,
        NES75: sommes.etudiants >= 75 ? sommes.etudiants * 0.01 : 0,
        liberations: somme(liberations.map(lib => Number(lib.qte || 0))) * 40,
        stages: somme(supervisions.map(s => {
            const nbStagiaires = Number(s.nbStagiaires || 0)
            const CIparStagiaire = Number(s.CIparStagiaire || 0)
            const coordination = Number(s.coordination || 0)
            const pourcentageCoordination = Number(s.pourcentageCoordination || 0)
            const facteurSupervision = 1 - (pourcentageCoordination / 100)
            const res = (nbStagiaires * CIparStagiaire * facteurSupervision) + coordination
            return isNaN(res) ? 0 : res
        }))
    }

    const total = 
        sommes.total + 
        exceptions.PES415 + 
        exceptions.NES160 + 
        exceptions.NES75 +
        exceptions.liberations +
        exceptions.stages

    return {
        groupes: groupesCI,
        sommes,
        exceptions,
        total: isNaN(total) ? 0 : total
    }
}

export type { Groupe, Liberation, SupervisionCalcul, ResultatCI, GroupeCI }
