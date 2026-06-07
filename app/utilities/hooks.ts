'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { Enseignant, Charge, Groupe, Cours, Liberation, Allocation } from "@/app/db/db"
import { filterEnseignants } from "./businessLogic"

/**
 * Hook personnalisé pour filtrer et trier les enseignants selon les critères de recherche.
 */
export function useFilteredEnseignants(
    enseignants: Enseignant[] | undefined,
    cache: string[],
    search: string,
    tri: string,
    charges: Charge[] | undefined,
    groupes: Groupe[] | undefined,
    cours: Cours[] | undefined,
    liberations: Liberation[] | undefined,
    allocations: Allocation[] | undefined,
    scenario: string
) {
    return useMemo(() => {
        if (!enseignants) return [];
        return filterEnseignants(
            enseignants,
            cache,
            search,
            tri,
            charges || [],
            groupes || [],
            cours || [],
            liberations || [],
            allocations || [],
            scenario
        );
    }, [enseignants, cache, search, tri, charges, groupes, cours, liberations, allocations, scenario]);
}

export function useContextMenu() {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ left: 0, top: 0 })
    const menuRef = useRef<HTMLDivElement>(null)

    const openMenu = (ev: React.MouseEvent | MouseEvent) => {
        ev.preventDefault()
        ev.stopPropagation()
        setIsVisible(true)
        setPosition({ left: ev.clientX, top: ev.clientY })
    }

    const closeMenu = () => {
        setIsVisible(false)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu()
            }
        }

        if (isVisible) {
            document.addEventListener("mousedown", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isVisible])

    // Re-position menu if it goes off-screen
    useEffect(() => {
        if (isVisible && menuRef.current) {
            const menu = menuRef.current
            const rect = menu.getBoundingClientRect()
            const { innerWidth, innerHeight } = window
            
            let newLeft = position.left
            let newTop = position.top

            if (position.left + rect.width > innerWidth) {
                newLeft = Math.max(10, innerWidth - rect.width - 10)
            }
            if (position.top + rect.height > innerHeight) {
                newTop = Math.max(10, innerHeight - rect.height - 10)
            }

            if (newLeft !== position.left || newTop !== position.top) {
                setPosition({ left: newLeft, top: newTop })
            }
        }
    }, [isVisible, position.left, position.top])

    return {
        isVisible,
        position,
        menuRef,
        openMenu,
        closeMenu
    }
}
