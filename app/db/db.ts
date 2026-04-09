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
    heuresTheorie: number
    heuresPratique: number
    heuresMaison: number
}

interface Session {
    id: number
    saison: string
    annee: string
}

interface Groupe {
    id: number
    session: Session
    cours: Cours
    nbEtudiants: number
}

interface Priorite{
    id: number
    enseignant: Enseignant
    cours: Cours
    sessionDebut: Session
}

interface Liberation{
    id: number
    code: string
    description: string
    quantite: number
    session: Session
    enseignant: Enseignant
}

interface Stage{
    id: number
    session: Session
    ETCparStagiaire: number
    nbStagiaires: number
}

interface Supervision{
    id: number
    enseignant: Enseignant
    stage: Stage
    nbStagiaires: number
}

const db = new Dexie("RCDToolkitDatabase") as Dexie & {
  enseignants: EntityTable<Enseignant, "id">,
  cours: EntityTable<Cours, "id">,
  sessions: EntityTable<Session, "id">,
  groupes: EntityTable<Groupe, "id">,
  priorites: EntityTable<Priorite, "id">,
  liberations: EntityTable<Liberation, "id">,
  stages: EntityTable<Stage, "id">,
  supervision: EntityTable<Supervision, "id">,
}

// Schema declaration:
db.version(1).stores({
    enseignants: "++id, numeroEmploye, prenom, nom, courriel",
    cours: "++id, nom, heuresTheorie, heuresPratique, heuresMaison",
    sessions: "++id, saison, annee",
    groupes: "++id, session, cours, nbEtudiants",
    priorites: "++id, enseignant, cours, sessionDebut",
    liberations: "++id, code, description, quantite, session, enseignant",
    stages: "++id, session, ETCparStagiaire, nbStagiaires",
    supervisions: "++id, enseignant, stage, nbStagiaires",
})

export type { Enseignant, Cours, Session, Groupe, Priorite, Liberation, Stage, Supervision }
export { db }