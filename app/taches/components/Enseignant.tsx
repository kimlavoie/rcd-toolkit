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
                backgroundColor: "#212529", 
                color: "white",
                display: "block", 
                padding: "10px", 
                zIndex: 9999,
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                minWidth: "150px",
                border: "1px solid #444"
            }}
        >
            <p className="mb-0"><button className="btn btn-outline-light btn-sm w-100" onClick={ev => { window.open("/admin/enseignants?highlight=" + enseignant.id, "_blank"); setHideMenu(true); }}>Modifier l'enseignant</button></p>
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
            width: `${width}px`,
            cursor: "context-menu",
            padding: "8px 12px"
        }} 
        key={enseignant.id}
        className="group"
        title="Clic droit pour plus d'options"
    >
        <div className="d-flex justify-content-between align-items-center gap-2">
            <p className="mb-0 overflow-hidden text-nowrap" style={{ fontSize: "0.85rem", textOverflow: "ellipsis" }}>{enseignant.prenom} {enseignant.nom}</p>
            <button 
                className="btn btn-xs btn-link text-muted p-0 m-0 border-0" 
                style={{ fontSize: "12px", opacity: 0.5, lineHeight: 1, textDecoration: "none" }}
                onClick={(e) => { e.stopPropagation(); onCache(); }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                title="Cacher cet enseignant"
            >
                ✕
            </button>
        </div>
        
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