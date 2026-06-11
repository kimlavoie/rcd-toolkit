'use client'

import BaseSelect from "./BaseSelect"
import type { Departement } from "@/app/db/db"

interface SelectDepartementProps {
    value: string
    onChange: (id: string) => void
    label?: string
}

export default function SelectDepartement({ value, onChange, label = "Choisir un département..." }: SelectDepartementProps) {
    return (
        <BaseSelect<Departement>
            collectionName="departements"
            value={value}
            onChange={onChange}
            label={label}
            sortFn={(a, b) => (a.nom || "").localeCompare(b.nom || "")}
            renderOption={d => d.nom}
        />
    )
}
