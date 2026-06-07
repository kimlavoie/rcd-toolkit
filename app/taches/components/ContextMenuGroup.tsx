'use client'
import React from "react"

interface ContextMenuGroupProps {
    position: { left: number, top: number }
    onClose: () => void
    onRemoveAll: () => void
    onTransferAll: () => void
    onEditCourse: () => void
    menuRef?: React.RefObject<HTMLDivElement | null>
}

export default function ContextMenuGroup({
    position,
    onClose,
    onRemoveAll,
    onTransferAll,
    onEditCourse,
    menuRef
}: ContextMenuGroupProps) {
    return (
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
                zIndex: 10000, 
                borderRadius: "8px", 
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)", 
                minWidth: "200px", 
                border: "1px solid #444",
                opacity: (position.left === 0 && position.top === 0) ? 0 : 1
            }}
            onClick={e => e.stopPropagation()}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Gestion du cours</p>
            <p className="mb-2">
                <button className="btn btn-danger btn-sm w-100" onClick={onRemoveAll}>🗑️ Tout supprimer</button>
            </p>
            <p className="mb-2">
                <button className="btn btn-primary btn-sm w-100" onClick={onTransferAll}>📤 Tout transférer...</button>
            </p>
            <p className="mb-0">
                <button className="btn btn-outline-light btn-sm w-100" onClick={onEditCourse}>🔍 Modifier le cours</button>
            </p>
        </div>
    )
}
