'use client'

import { useState, useMemo, useEffect } from "react"
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"

interface UseGenericAdminOptions<T> {
    collectionName: keyof typeof firebaseDb
    initialSortKey: keyof T
    filterFn: (item: T, search: string) => boolean
    defaultNewData: Partial<T>
    onBeforeAdd?: (data: Partial<T>) => boolean | void
}

interface FirebaseTable {
    add: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
}

export function useGenericAdmin<T extends { id: string }>({
    collectionName,
    initialSortKey,
    filterFn,
    defaultNewData,
    onBeforeAdd
}: UseGenericAdminOptions<T>) {
    const data = useFirestoreCollection<T>(collectionName as string)
    const [search, setSearch] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<Partial<T>>({})
    const [newData, setNewData] = useState<Partial<T>>(defaultNewData)

    const table = firebaseDb[collectionName] as unknown as FirebaseTable

    const filteredData = useMemo(() => {
        if (!data) return []
        if (!search) return data
        return data.filter(item => filterFn(item, search))
    }, [data, search, filterFn])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(filteredData, initialSortKey)

    const startEdit = (item: T) => {
        setEditingId(item.id)
        setEditData({ ...item })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditData({})
    }

    const saveEdit = async () => {
        if (editingId) {
            try {
                await table.update(editingId, editData)
                setEditingId(null)
                setEditData({})
                toast.success("Modifications enregistrées")
            } catch (error) {
                console.error("Error saving:", error)
            }
        }
    }

    const addNew = async () => {
        if (onBeforeAdd) {
            const result = onBeforeAdd(newData)
            if (result === false) return
        }

        try {
            await table.add(newData)
            setNewData(defaultNewData)
            toast.success("Élément ajouté")
        } catch (error) {
            console.error("Error adding:", error)
        }
    }

    const deleteItem = async (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
            try {
                await table.delete(id)
                toast.success("Élément supprimé")
            } catch (error) {
                console.error("Error deleting:", error)
            }
        }
    }

    return {
        search,
        setSearch,
        sortedData,
        toggleSort,
        getSortIcon,
        editingId,
        editData,
        setEditData,
        newData,
        setNewData,
        startEdit,
        cancelEdit,
        saveEdit,
        addNew,
        deleteItem
    }
}
