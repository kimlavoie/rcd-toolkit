'use client'
import { useRouter } from "next/navigation";
import SelectSession from "../components/inputs/SelectSession";
import { useState } from "react";

export default function(){
    const [session, setSession] = useState("A26")
    const router = useRouter()
    return <div className="container mt-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm p-4">
                    <h2 className="mb-4 text-center">Sélection de session</h2>
                    <p className="text-muted text-center mb-4">Choisissez la session pour gérer les <strong>libérations</strong>.</p>
                    <div className="mb-4">
                        <SelectSession code="A26" onChange={(code: any) => setSession(code)} />
                    </div>
                    <button className="btn btn-primary btn-lg w-100" onClick={() => router.push(`liberations/${session}`)}>Accéder aux libérations</button>
                </div>
            </div>
        </div>
    </div>
}