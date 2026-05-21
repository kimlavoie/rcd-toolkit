'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";
import SelectSession from "../admin/components/inputs/SelectSession";
import { useAuth } from "../utilities/auth";

export default function(){
    const { user, loading } = useAuth()
    const [session, setSession] = useState("A26")
    const router = useRouter()

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    return <div className="container mt-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm p-4">
                    <h2 className="mb-4 text-center">Sélection de session</h2>
                    <p className="text-muted text-center mb-4">Choisissez la session pour consulter et gérer les <strong>tâches des enseignants</strong>.</p>
                    <div className="mb-4">
                        <SelectSession code="A26" onChange={(code: any) => setSession(code)} />
                    </div>
                    <button className="btn btn-primary btn-lg w-100" onClick={() => router.push(`taches/${session}`)}>Accéder aux tâches</button>
                </div>
            </div>
        </div>
    </div>
}