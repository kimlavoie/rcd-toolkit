'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDanger?: boolean
}

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    isDanger = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const modalContent = (
        <div 
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                backdropFilter: "blur(4px)"
            }}
            onClick={onClose}
        >
            <div 
                className="card shadow-lg border-0" 
                style={{ width: "100%", maxWidth: "450px", borderRadius: "12px", overflow: "hidden" }}
                onClick={e => e.stopPropagation()}
            >
                <div className={`card-header ${isDanger ? 'bg-danger' : 'bg-primary'} text-white py-3 d-flex justify-content-between align-items-center`}>
                    <h5 className="mb-0 fw-bold">{title}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 mb-4">
                        <div style={{ fontSize: "2rem" }}>{isDanger ? "⚠️" : "ℹ️"}</div>
                        <div className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
                            {message.split('\n').map((line, i) => <p key={i} className={i === 0 ? "mb-2" : "mb-0"}>{line}</p>)}
                        </div>
                    </div>
                    
                    <div className="d-flex gap-2 justify-content-end">
                        <button 
                            className="btn btn-light px-4 rounded-pill border fw-bold text-muted" 
                            style={{ fontSize: "0.85rem" }}
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                        <button 
                            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} px-4 rounded-pill shadow-sm fw-bold`} 
                            style={{ fontSize: "0.85rem" }}
                            onClick={handleConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
