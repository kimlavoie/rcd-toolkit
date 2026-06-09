import { BaseService } from "./BaseService";
import type { 
    Enseignant, 
    Cours, 
    Groupe, 
    Allocation, 
    Liberation, 
    Stage, 
    Supervision, 
    Charge, 
    CIReelle, 
    Scenario 
} from "@/app/db/db";

export const EnseignantService = new BaseService<Enseignant>("enseignants");
export const CoursService = new BaseService<Cours>("cours");
export const GroupeService = new BaseService<Groupe>("groupes");
export const AllocationService = new BaseService<Allocation>("allocations");
export const LiberationService = new BaseService<Liberation>("liberations");
export const StageService = new BaseService<Stage>("stages");
export const SupervisionService = new BaseService<Supervision>("supervisions");
export const ChargeService = new BaseService<Charge>("charges");
export const CIReelleService = new BaseService<CIReelle>("CIReelles");
export const ScenarioService = new BaseService<Scenario>("scenarios");

export const Services = {
    enseignants: EnseignantService,
    cours: CoursService,
    groupes: GroupeService,
    allocations: AllocationService,
    liberations: LiberationService,
    stages: StageService,
    supervisions: SupervisionService,
    charges: ChargeService,
    CIReelles: CIReelleService,
    scenarios: ScenarioService,
};
