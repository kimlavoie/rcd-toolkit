'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCorrespondingSessions } from "@/app/utilities/sessions"

interface AdminSessionSwitcherProps {
    currentSession: string
    basePath: string
    className?: string
}

export default function AdminSessionSwitcher({
    currentSession,
    basePath,
    className = ""
}: AdminSessionSwitcherProps) {
    const router = useRouter()
    const {
        currentSaison,
        autumnSession,
        winterSession,
        autumnYear,
        winterYear
    } = getCorrespondingSessions(currentSession)

    return (
        <div className={`d-flex align-items-center gap-2 ${className}`}>
            <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden border bg-white" style={{ height: "30px" }}>
                <button
                    type="button"
                    className={`btn ${currentSaison === 'Automne' ? 'btn-primary fw-bold' : 'btn-white text-muted border-0'}`}
                    style={{ fontSize: "0.8rem", padding: "0 12px" }}
                    onClick={() => {
                        if (currentSession !== autumnSession) {
                            router.push(`${basePath}/${autumnSession}`)
                        }
                    }}
                    title={`Basculer vers Automne ${autumnYear}`}
                >
                    🍂 Automne {autumnYear}
                </button>
                <button
                    type="button"
                    className={`btn ${currentSaison === 'Hiver' ? 'btn-primary fw-bold' : 'btn-white text-muted border-0'}`}
                    style={{ fontSize: "0.8rem", padding: "0 12px" }}
                    onClick={() => {
                        if (currentSession !== winterSession) {
                            router.push(`${basePath}/${winterSession}`)
                        }
                    }}
                    title={`Basculer vers Hiver ${winterYear}`}
                >
                    ❄️ Hiver {winterYear}
                </button>
            </div>

            <Link
                href={basePath}
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 d-flex align-items-center gap-1 shadow-sm"
                style={{ height: "30px", fontSize: "0.75rem" }}
                title="Choisir une autre session"
            >
                <span>📅</span>
                <span className="d-none d-sm-inline">Autre session</span>
            </Link>
        </div>
    )
}
