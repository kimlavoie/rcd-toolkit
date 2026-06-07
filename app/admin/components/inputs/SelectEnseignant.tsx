'use client'

import BaseSelect from "./BaseSelect"
import type { Enseignant } from "@/app/db/db"

export default function SelectEnseignant({value, onChange}: {value: string, onChange: (v: string) => void}){
    return (
        <BaseSelect<Enseignant>
            collectionName="enseignants"
            value={value}
            onChange={onChange}
            label="Choisissez un enseignant"
            sortFn={(a, b) => {
                const nomComp = (a.nom || "").localeCompare(b.nom || "");
                if (nomComp !== 0) return nomComp;
                return (a.prenom || "").localeCompare(b.prenom || "");
            }}
            renderOption={e => `${e.prenom} ${e.nom}`}
        />
    )
}
