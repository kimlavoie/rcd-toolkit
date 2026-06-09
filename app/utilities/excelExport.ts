import * as XLSX from 'xlsx';
import type { Enseignant, Charge, Groupe, Cours, Liberation, Allocation, Stage, Supervision } from "@/app/db/db";

interface ExportData {
    enseignants: Enseignant[];
    groupes: Groupe[];
    charges: Charge[];
    allocations: Allocation[];
    liberations: Liberation[];
    stages: Stage[];
    supervisions: Supervision[];
    cours: Cours[];
    scenarioId: string;
    sessions: string[];
    year: string;
}

export function exportToExcel(data: ExportData) {
    const { enseignants, groupes, charges, allocations, liberations, stages, supervisions, cours, scenarioId, sessions, year } = data;

    const workbook = XLSX.utils.book_new();

    sessions.forEach(sCode => {
        // 1. Onglet Cours
        const coursData: any[] = [];
        enseignants.forEach(enseignant => {
            const profCharges = charges.filter((c: any) => c.enseignant === enseignant.id && (c.scenario || "production") === scenarioId);
            profCharges.forEach((c: any) => {
                const grp = groupes.find((g: any) => g.id === c.groupe && g.session === sCode);
                if (grp) {
                    const cour = cours.find((crs: any) => crs.id === grp.cours);
                    coursData.push({
                        "NoEmploye": enseignant.numeroEmploye || "",
                        "Nom": enseignant.nom || "",
                        "Prenom": enseignant.prenom || "",
                        "Sigle": cour?.sigle || "Inconnu",
                        "Nom Cours": cour?.nom || "",
                        "Groupe": grp.id.substring(0, 4),
                        "Etudiants": grp.nbEtudiants,
                        "Type": c.type,
                        "Semaines": c.nbSemaines
                    });
                }
            });
        });

        if (coursData.length > 0) {
            const wsCours = XLSX.utils.json_to_sheet(coursData);
            XLSX.utils.book_append_sheet(workbook, wsCours, `${sCode} - Cours`);
        }

        // 2. Onglet Libérations
        const libsData: any[] = [];
        enseignants.forEach(enseignant => {
            const profLibs = liberations.filter((l: any) => l.enseignant === enseignant.id && (l.scenario || "production") === scenarioId);
            profLibs.forEach((l: any) => {
                const alloc = allocations.find((a: any) => a.id === l.allocation && a.session === sCode);
                if (alloc) {
                    libsData.push({
                        "NoEmploye": enseignant.numeroEmploye || "",
                        "Nom": enseignant.nom || "",
                        "Prenom": enseignant.prenom || "",
                        "Code Allocation": alloc.code,
                        "Description": alloc.description || "",
                        "Quantite (ETC)": l.quantite
                    });
                }
            });
        });

        if (libsData.length > 0) {
            const wsLibs = XLSX.utils.json_to_sheet(libsData);
            XLSX.utils.book_append_sheet(workbook, wsLibs, `${sCode} - Libérations`);
        }

        // 3. Onglet Stages (Supervisions)
        const stagesData: any[] = [];
        enseignants.forEach(enseignant => {
            const profSups = supervisions.filter((s: any) => s.enseignant === enseignant.id && (s.scenario || "production") === scenarioId);
            profSups.forEach((s: any) => {
                const stage = stages.find((st: any) => st.id === s.stage && st.session === sCode);
                if (stage) {
                    stagesData.push({
                        "NoEmploye": enseignant.numeroEmploye || "",
                        "Nom": enseignant.nom || "",
                        "Prenom": enseignant.prenom || "",
                        "Nom Stage": stage.nom,
                        "Stagiaires": s.nbStagiaires,
                        "Coordination (CI)": s.coordination
                    });
                }
            });
        });

        if (stagesData.length > 0) {
            const wsStages = XLSX.utils.json_to_sheet(stagesData);
            XLSX.utils.book_append_sheet(workbook, wsStages, `${sCode} - Stages`);
        }
    });

    // S'il n'y a aucune donnée à exporter, ajouter une feuille vide pour éviter un crash
    if (workbook.SheetNames.length === 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Message": "Aucune donnée trouvée" }]), "Vide");
    }

    // Télécharger le fichier
    XLSX.writeFile(workbook, `Taches_${year}_${scenarioId}.xlsx`);
}
