'use client'

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Enseignant as EnseignantType } from "@/app/db/db"

export default function Enseignant({enseignant, onCache, globalWidth}: {enseignant: EnseignantType, onCache: () => void, globalWidth?: number}){
    const [hideMenu, setHideMenu] = useState(true)
    const [position, setPosition] = useState({left: 0, top: 0})
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    const [width, setWidth] = useState(globalWidth || 200)
    const isResizing = useRef(false)

    useEffect(() => {
        if (globalWidth) {
            setWidth(globalWidth)
        }
    }, [globalWidth])

    const startResizing = (e: React.MouseEvent) => {
        e.stopPropagation()
        isResizing.current = true
        const startX = e.pageX
        const startWidth = width
        
        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return
            const newWidth = startWidth + (moveEvent.pageX - startX)
            setWidth(newWidth > 100 ? newWidth : 100)
        }
        
        const onMouseUp = () => {
            isResizing.current = false
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }
        
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }

    useEffect(() => {
        setMounted(true)
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setHideMenu(true);
            }
        };

        if (!hideMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [hideMenu]);

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
        setPosition({left: ev.clientX, top: ev.clientY})
    }

    const menuContent = !hideMenu && (
        <div 
            ref={menuRef}
            style={{
                position: "fixed", 
                left: position.left, 
                top: position.top, 
                backgroundColor: "#444", 
                color: "white",
                display: "block", 
                padding: "10px", 
                zIndex: 9999,
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                minWidth: "150px"
            }}
        >
            <p className="mb-2"><button className="btn btn-outline-light btn-sm w-100" onClick={ev => window.open("/admin/enseignants?highlight=" + enseignant.id, "_blank")}>Modifier l'enseignant</button></p>
            <button className="btn btn-danger btn-sm w-100" onClick={() => { onCache(); setHideMenu(true); }}>Cacher</button>
        </div>
    )

    return <th 
        onContextMenu={openMenu} 
        style={{
            position: "sticky", 
            zIndex: 100, 
            top: "0", 
            color: "black", 
            backgroundColor: "lightgray",
            minWidth: `${width}px`,
            width: `${width}px`
        }} 
        key={enseignant.id}
    >
        <p className="mb-0 pe-3">{enseignant.prenom} {enseignant.nom}</p>
        
        <div 
            onMouseDown={startResizing}
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '5px',
                cursor: 'col-resize',
                zIndex: 1
            }}
        />

        {mounted && menuContent && createPortal(menuContent, document.body)}
    </th>
    
}