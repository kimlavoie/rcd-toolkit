'use client'

import React from 'react'

interface SupervisionInputsProps {
    enseignantId: string
    stageId: string
    stValue: number
    coValue: number
    onUpdate: (field: 'nbStagiaires' | 'coordination', value: number) => void
}

export default function SupervisionInputs({
    enseignantId,
    stageId,
    stValue,
    coValue,
    onUpdate
}: SupervisionInputsProps) {
    return (
        <div className="d-flex flex-column gap-1 align-items-center justify-content-center py-1">
            <div className="input-group input-group-sm" style={{maxWidth: "85px"}}>
                <span className="input-group-text p-1 bg-light text-muted border-0" style={{fontSize: "0.6rem"}} title="Stagiaires">🎓</span>
                <input 
                    className="form-control text-center p-0" 
                    type="number" 
                    min="0" 
                    step="1" 
                    value={stValue} 
                    onChange={e => onUpdate('nbStagiaires', Number(e.target.value))} 
                    style={{fontSize: "0.75rem"}} 
                    title="Nombre de stagiaires"
                />
            </div>
            <div className="input-group input-group-sm" style={{maxWidth: "85px"}}>
                <span className="input-group-text p-1 bg-light text-muted border-0" style={{fontSize: "0.6rem"}} title="Coordination">📢</span>
                <input 
                    className="form-control text-center p-0" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={coValue} 
                    onChange={e => onUpdate('coordination', Number(e.target.value))} 
                    style={{fontSize: "0.75rem"}} 
                    title="Coordination (CI)"
                />
            </div>
        </div>
    )
}
