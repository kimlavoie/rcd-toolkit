import { useState, useMemo } from "react"
import { useTableSort } from "@/app/utilities/sorting"

interface UseAdminTableOptions<T> {
    data: T[] | undefined
    initialSortKey: keyof T
    filterFn: (item: T, search: string) => boolean
}

export function useAdminTable<T>({ data, initialSortKey, filterFn }: UseAdminTableOptions<T>) {
    const [search, setSearch] = useState("")

    const filteredData = useMemo(() => {
        if (!data) return []
        if (!search) return data
        return data.filter(item => filterFn(item, search))
    }, [data, search, filterFn])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(filteredData, initialSortKey)

    return {
        search,
        setSearch,
        sortedData,
        toggleSort,
        getSortIcon
    }
}
