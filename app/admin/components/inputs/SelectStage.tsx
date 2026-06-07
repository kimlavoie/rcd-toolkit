'use client'

import BaseSelect from "./BaseSelect"
import { extractSessionInfos } from "@/app/utilities/sessions"
import type { Stage } from "@/app/db/db"

export default function SelectStage({value, onChange}: {value: string, onChange: (v: string) => void}){
    return (
        <BaseSelect<Stage>
            collectionName="stages"
            value={value}
            onChange={onChange}
            label="Choisissez un stage"
            sortFn={(a, b) => (a.session || "").localeCompare(b.session || "")}
            renderOption={stage => {
                const {saison, annee} = extractSessionInfos(stage.session)
                return `${saison} ${annee} - ${stage.nom || 'Sans nom'}`
            }}
        />
    )
}
