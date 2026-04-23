'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";
import SelectSession from "../admin/components/inputs/SelectSession";

export default function(){
    const [session, setSession] = useState("A26")
    const router = useRouter()
    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <SelectSession code="A26" onChange={(code: any) => setSession(code)} />
        <button onClick={() => router.push(`taches/${session}`)}>Sélectionner</button>
    </>
}