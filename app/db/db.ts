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
}

export interface Allocation{
    id: string
    code: string
    description: string
    quantite: number
    session: string
}

export interface Liberation{
    id: string
    allocation: string
    enseignant: string
    quantite: number
}

export interface Stage{
    id: string
    session: string
    ETCparStagiaire: number
    nbStagiaires: number
}

export interface Supervision{
    id: string
    enseignant: string
    stage: string
    nbStagiaires: number
}

export interface Charge{
    id: string
    enseignant: string
    groupe: string
    nbSemaines: number
}

export interface CIReelle {
    id: string
    enseignant: string
    session: string
    CI: number
}
