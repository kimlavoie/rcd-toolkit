export interface Enseignant {
  id: string
  numeroEmploye: string
  prenom: string
  nom: string
  courriel: string
}

export interface Cours {
    id: string
    sigle: string
    nom: string
    saison: string
    couleur: string
    heuresTheorie: number
    heuresPratique: number
    heuresMaison: number
}

export interface Groupe {
    id: string
    session: string
    cours: string
    nbEtudiants: number
    aTheorie?: boolean
    aPratique?: boolean
}

export interface Allocation{
    id: string
    code: string
    description: string
    quantite: number
    session: string
}

export interface Stage{
    id: string
    session: string
    nom: string
    CIparStagiaire: number
    nbStagiaires: number
    pourcentageCoordination?: number
}

export interface Charge{
    id: string
    enseignant: string
    groupe: string
    nbSemaines: number
    type?: "T" | "P" | "TP"
    scenario?: string
}

export interface Liberation {
    id: string
    enseignant: string
    allocation: string
    quantite: number
    scenario?: string
}

export interface Supervision {
    id: string
    enseignant: string
    stage: string
    nbStagiaires: number
    coordination?: number
    scenario?: string
}

export interface Scenario {
    id: string
    nom: string
    session: string
    notes?: string
    isDefault?: boolean
}

export interface CIReelle {
    id: string
    enseignant: string
    session: string
    CI: number
}
