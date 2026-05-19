'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface InputModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (value: number) => void
    title: string
    label: string
    defaultValue: number
    max: number
    step?: number
}

export default function InputModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    label, 
    defaultValue, 
    max,
    step = 1
}: InputModalProps) {
    const [value, setValue] = useState(defaultValue)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            setValue(defaultValue)
        }
    }, [isOpen, defaultValue])

    if (!isOpen || !mounted) return null

    const handleConfirm = () => {
        if (isNaN(value) || value < 0) {
            alert("Veuillez entrer un nombre valide")
            return
        }
        if (value > max + 0.0001) {
            alert(`La valeur maximale autorisée est ${max}`)
            return
        }
        onConfirm(value)
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
                backdropFilter: "blur(2px)"
            }}
            onClick={onClose}
        >
            <div 
                className="card shadow-lg" 
                style={{ width: "100%", maxWidth: "400px" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{title}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="card-body py-4">
                    <div className="mb-3">
                        <label className="form-label fw-bold">{label}</label>
                        <div className="input-group">
                            <input 
                                type="number" 
                                className="form-control form-control-lg text-center" 
                                value={value} 
                                onChange={e => setValue(Number(e.target.value))}
                                min="0"
                                max={max}
                                step={step}
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleConfirm()
                                    if (e.key === 'Escape') onClose()
                                }}
                            />
                            <span className="input-group-text bg-light">/ {max}</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-end mt-4">
                        <button className="btn btn-outline-secondary px-4 rounded-pill" onClick={onClose}>Annuler</button>
                        <button className="btn btn-primary px-4 rounded-pill shadow-sm" onClick={handleConfirm}>Confirmer</button>
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
