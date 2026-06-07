import React from "react"

interface AdminHeaderProps {
    title: string
    search: string
    setSearch: (val: string) => void
    placeholder?: string
}

export default function AdminHeader({ title, search, setSearch, placeholder = "Rechercher..." }: AdminHeaderProps) {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">{title}</h1>
            <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder={placeholder} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
                {search && (
                    <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}>✕</button>
                )}
            </div>
        </div>
    )
}
