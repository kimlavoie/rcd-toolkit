'use client'

import BaseSelect from "./BaseSelect"
import type { Allocation } from "@/app/db/db"

export default function SelectAllocation({value, onChange, session}: {value: string, onChange: (v: string) => void, session?: string}){
    return (
        <BaseSelect<Allocation>
            collectionName="allocations"
            value={value}
            onChange={onChange}
            label="Choisissez une allocation"
            filterFn={a => !session || a.session === session}
            sortFn={(a, b) => (a.code || "").localeCompare(b.code || "")}
            renderOption={a => `${a.code} - ${a.description} (${a.quantite})`}
        />
    )
}
