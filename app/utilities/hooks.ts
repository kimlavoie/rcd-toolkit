'use client'

import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react'
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
    const [rawPosition, setRawPosition] = useState({ left: 0, top: 0 })
    const [adjustedPosition, setAdjustedPosition] = useState({ left: 0, top: 0 })
    const menuRef = useRef<HTMLDivElement>(null)

    const openMenu = (ev: React.MouseEvent | MouseEvent) => {
        ev.preventDefault()
        ev.stopPropagation()
        
        const pos = { left: ev.clientX, top: ev.clientY }
        setRawPosition(pos)
        setAdjustedPosition(pos)
        setIsVisible(true)
    }

    const closeMenu = () => {
        setIsVisible(false)
    }

    // Handle closing when clicking outside or opening another menu
    useEffect(() => {
        if (!isVisible) return

        const handleOutsideAction = (event: Event) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu()
            }
        }

        document.addEventListener("mousedown", handleOutsideAction, true)
        document.addEventListener("contextmenu", handleOutsideAction, true)
        document.addEventListener("touchstart", handleOutsideAction, true)

        return () => {
            document.removeEventListener("mousedown", handleOutsideAction, true)
            document.removeEventListener("contextmenu", handleOutsideAction, true)
            document.removeEventListener("touchstart", handleOutsideAction, true)
        }
    }, [isVisible])

    const adjust = () => {
        if (menuRef.current) {
            const menu = menuRef.current
            const rect = menu.getBoundingClientRect()
            const { innerWidth, innerHeight } = window
            
            let newLeft = rawPosition.left
            let newTop = rawPosition.top

            if (rawPosition.left + rect.width > innerWidth) {
                newLeft = Math.max(10, innerWidth - rect.width - 10)
            }
            if (rawPosition.top + rect.height > innerHeight) {
                newTop = Math.max(10, innerHeight - rect.height - 10)
            }

            if (newLeft !== adjustedPosition.left || newTop !== adjustedPosition.top) {
                setAdjustedPosition({ left: newLeft, top: newTop })
            }
        }
    }

    useLayoutEffect(() => {
        if (isVisible) adjust()
    }, [isVisible, rawPosition.left, rawPosition.top])

    useEffect(() => {
        if (!isVisible || !menuRef.current) return
        const resizeObserver = new ResizeObserver(adjust)
        resizeObserver.observe(menuRef.current)
        return () => resizeObserver.disconnect()
    }, [isVisible, rawPosition.left, rawPosition.top, adjustedPosition])

    return {
        isVisible,
        position: adjustedPosition,
        menuRef,
        openMenu,
        closeMenu
    }
}
