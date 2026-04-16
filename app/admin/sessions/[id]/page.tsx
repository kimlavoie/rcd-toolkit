'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import SessionForm from "../../components/forms/SessionForm";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(session: any){
        const {id, ...rest} = session
        db.sessions.update(Number(id), rest)
        router.push("../sessions")
    }

    return <>
        <SessionForm id={params.id} onSubmit={submit} />
        <button onClick={() => router.push("../enseignants")}>Retour</button>
    </>
    
}