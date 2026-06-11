export interface Departement {
  id: string
  nom: string
}

export interface Enseignant {
  id: string
  departementId?: string
  numeroEmploye: string
  prenom: string
  nom: string
  courriel: string
  role?: "ADMIN" | "COORDONNATEUR" | "ENSEIGNANT"
  authUid?: string
}

export interface Cours {
    id: string
    departementId?: string
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
    departementId?: string
    session: string
    cours: string
    nbEtudiants: number
    aTheorie?: boolean
    aPratique?: boolean
}

export interface Allocation{
    id: string
    departementId?: string
    code: string
    description: string
    quantite: number
    session: string
}

export interface Stage{
    id: string
    departementId?: string
    session: string
    nom: string
    CIparStagiaire: number
    nbStagiaires: number
    pourcentageCoordination?: number
}

export interface Charge{
    id: string
    departementId?: string
    enseignant: string
    groupe: string
    nbSemaines: number
    type?: "T" | "P" | "TP"
    scenario?: string
}

export interface Liberation {
    id: string
    departementId?: string
    enseignant: string
    allocation: string
    quantite: number
    scenario?: string
}

export interface Supervision {
    id: string
    departementId?: string
    enseignant: string
    stage: string
    nbStagiaires: number
    coordination?: number
    scenario?: string
}

export interface Scenario {
    id: string
    departementId?: string
    nom: string
    session: string
    notes?: string
    isDefault?: boolean
}

export interface CIReelle {
    id: string
    departementId?: string
    enseignant: string
    session: string
    CI: number
}

export interface Preference {
  id: string
  departementId?: string
  enseignant: string
  cours?: string
  allocation?: string
  stage?: string
  type: 'ABSOLUE' | 'ORDINAIRE' | 'INTERET'
  anneeObtention?: number
}

export interface Parametres {
  id: string
  departementId?: string
  dureePrioriteOrdinaire: number
}
