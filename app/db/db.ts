import { Dexie, type EntityTable } from "dexie"

interface Enseignant {
  id: number
  numeroEmploye: string
  prenom: string
  nom: string
  courriel: string
}

interface Cours {
    id: number
    sigle: string
    nom: string
    saison: string
    heuresTheorie: number
    heuresPratique: number
    heuresMaison: number
}

interface Groupe {
    id: number
    session: string
    cours: number
    nbEtudiants: number
}

interface Priorite{
    id: number
    enseignant: number
    cours: number
    sessionDebut: string
}

interface Allocation{
    id: number
    code: string
    description: string
    quantite: number
    session: string
}

interface Liberation{
    id: number
    allocation: number
    enseignant: number
    quantite: number
}

interface Stage{
    id: number
    session: string
    ETCparStagiaire: number
    nbStagiaires: number
}

interface Supervision{
    id: number
    enseignant: number
    stage: number
    nbStagiaires: number
}

interface Charge{
    id: number
    enseignant: number
    groupe: number
    nbSemaines: number
}

const db = new Dexie("RCDToolkitDatabase") as Dexie & {
  enseignants: EntityTable<Enseignant, "id">,
  cours: EntityTable<Cours, "id">,
  groupes: EntityTable<Groupe, "id">,
  priorites: EntityTable<Priorite, "id">,
  allocations: EntityTable<Allocation, "id">,
  liberations: EntityTable<Liberation, "id">,
  stages: EntityTable<Stage, "id">,
  supervisions: EntityTable<Supervision, "id">,
  charges: EntityTable<Charge, "id">,
}

// Schema declaration:
db.version(3).stores({
    enseignants: "++id, numeroEmploye, prenom, nom, courriel",
    cours: "++id, nom, saison, heuresTheorie, heuresPratique, heuresMaison",
    groupes: "++id, session, cours, nbEtudiants",
    priorites: "++id, enseignant, cours, sessionDebut",
    allocations: "++id, code, description, quantite, session",
    liberations: "++id, allocation, enseignant, quantite",
    stages: "++id, session, ETCparStagiaire, nbStagiaires",
    supervisions: "++id, enseignant, stage, nbStagiaires",
    charges: "++id, enseignant, groupe, nbSemaines",
})

export type { Enseignant, Cours, Groupe, Priorite, Allocation, Liberation, Stage, Supervision, Charge }
export { db }