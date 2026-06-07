import { z } from "zod";

export const EnseignantSchema = z.object({
  numeroEmploye: z.string().optional(),
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  courriel: z.string().email("Format de courriel invalide").optional().or(z.literal("")),
});

export const CoursSchema = z.object({
  sigle: z.string().min(1, "Le sigle est requis"),
  nom: z.string().min(1, "Le nom du cours est requis"),
  saison: z.string().optional(),
  couleur: z.string().optional(),
  heuresTheorie: z.coerce.number().min(0),
  heuresPratique: z.coerce.number().min(0),
  heuresMaison: z.coerce.number().min(0).optional(),
});

export const GroupeSchema = z.object({
  session: z.string().min(1),
  cours: z.string().min(1),
  nbEtudiants: z.coerce.number().min(0),
  aTheorie: z.boolean().default(true),
  aPratique: z.boolean().default(true),
});

export const AllocationSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  quantite: z.coerce.number().min(0),
  session: z.string().min(1),
});

export const StageSchema = z.object({
  session: z.string().min(1),
  nom: z.string().min(1, "Le nom du stage est requis"),
  CIparStagiaire: z.coerce.number().min(0),
  nbStagiaires: z.coerce.number().min(0),
  pourcentageCoordination: z.coerce.number().min(0).max(100).default(0),
});

export const ChargeSchema = z.object({
  enseignant: z.string().min(1),
  groupe: z.string().min(1),
  nbSemaines: z.coerce.number().min(0).max(15),
  type: z.enum(["T", "P", "TP"]).default("TP"),
  scenario: z.string().optional(),
  session: z.string().optional(),
});

export const LiberationSchema = z.object({
  enseignant: z.string().min(1),
  allocation: z.string().min(1),
  quantite: z.coerce.number().min(0),
  scenario: z.string().optional(),
  session: z.string().optional(),
});

export const SupervisionSchema = z.object({
  enseignant: z.string().min(1),
  stage: z.string().min(1),
  nbStagiaires: z.coerce.number().min(0),
  coordination: z.coerce.number().min(0).default(0),
  scenario: z.string().optional(),
  session: z.string().optional(),
});

export const ScenarioSchema = z.object({
  nom: z.string().min(1, "Le nom du scénario est requis"),
  session: z.string().min(1),
  notes: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const CIReelleSchema = z.object({
  enseignant: z.string().min(1),
  session: z.string().min(1),
  CI: z.coerce.number().min(0),
});

export const Schemas: Record<string, z.ZodSchema> = {
  enseignants: EnseignantSchema,
  cours: CoursSchema,
  groupes: GroupeSchema,
  allocations: AllocationSchema,
  stages: StageSchema,
  charges: ChargeSchema,
  liberations: LiberationSchema,
  supervisions: SupervisionSchema,
  scenarios: ScenarioSchema,
  CIReelles: CIReelleSchema,
};
