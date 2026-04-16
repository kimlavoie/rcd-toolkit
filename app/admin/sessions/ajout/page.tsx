'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import SessionForm from "../../components/forms/SessionForm"

export default function(){
    const router = useRouter()

    function submit(session: any, resetForm: any){
        db.sessions.add(session)
        resetForm()
    }

    return <>
        <SessionForm onSubmit={submit} />
        <button onClick={() => router.push("../sessions")}>Retour</button>
    </>
    
}