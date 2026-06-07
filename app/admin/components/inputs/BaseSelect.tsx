'use client'

import { useFirestoreCollection } from "@/app/utilities/firebaseDb"

interface BaseSelectProps<T> {
    collectionName: string
    value: string
    onChange: (value: string) => void
    label: string
    filterFn?: (item: T) => boolean
    sortFn?: (a: T, b: T) => number
    renderOption: (item: T) => React.ReactNode
    name?: string
}

export default function BaseSelect<T extends { id: string }>({
    collectionName,
    value,
    onChange,
    label,
    filterFn,
    sortFn,
    renderOption,
    name
}: BaseSelectProps<T>) {
    const data = useFirestoreCollection<T>(collectionName)
    
    const processedData = (data ?? [])
        .filter(item => !filterFn || filterFn(item))
        .sort(sortFn)

    return (
        <select 
            name={name || collectionName} 
            className="form-select" 
            value={value} 
            onChange={(ev) => onChange(ev.target.value)}
        >
            <option value="" hidden disabled>{label}</option>
            {processedData.map((item) => (
                <option key={item.id} value={item.id}>
                    {renderOption(item)}
                </option>
            ))}
        </select>
    )
}
