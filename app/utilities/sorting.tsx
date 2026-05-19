import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc";

export function useTableSort<T>(data: T[] | undefined, initialKey: keyof T, initialOrder: SortOrder = "asc") {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; order: SortOrder }>({
        key: initialKey,
        order: initialOrder,
    });

    const sortedData = useMemo(() => {
        if (!data) return [];
        const sorted = [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === bValue) return 0;

            let comparison = 0;
            if (typeof aValue === "string" && typeof bValue === "string") {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = aValue < bValue ? -1 : 1;
            }

            return sortConfig.order === "asc" ? comparison : -comparison;
        });
        return sorted;
    }, [data, sortConfig]);

    const toggleSort = (key: keyof T) => {
        setSortConfig((prev) => ({
            key,
            order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
        }));
    };

    const getSortIcon = (key: keyof T) => {
        if (sortConfig.key !== key) return "↕️";
        return sortConfig.order === "asc" ? "🔼" : "🔽";
    };

    return { sortedData, toggleSort, getSortIcon, sortConfig };
}
