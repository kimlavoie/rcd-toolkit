'use client'
import { useRouter } from "next/navigation";
import SelectSession from "../components/inputs/SelectSession";
import { useState } from "react";

export default function(){
    const [session, setSession] = useState("A26")
    const router = useRouter()
    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <SelectSession code="A26" onChange={(code: any) => setSession(code)} />
        <button onClick={() => router.push(`liberations/${session}`)}>Sélectionner</button>
    </>
}