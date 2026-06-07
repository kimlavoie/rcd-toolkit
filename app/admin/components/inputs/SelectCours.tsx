'use client'

import BaseSelect from "./BaseSelect"
import type { Cours } from "@/app/db/db"

export default function SelectCours({value, onChange, saison}: {value: string, onChange: (v: string) => void, saison?: string}){
    return (
        <BaseSelect<Cours>
            collectionName="cours"
            value={value}
            onChange={onChange}
            label="Choisissez un cours"
            filterFn={c => !saison || c.saison === saison}
            sortFn={(a, b) => (a.sigle || "").localeCompare(b.sigle || "")}
            renderOption={c => `${c.sigle} - ${c.nom}`}
        />
    )
}
