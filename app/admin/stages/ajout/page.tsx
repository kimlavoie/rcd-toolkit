'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import StageForm from "../../components/forms/StageForm"

export default function(){

    const router = useRouter()

    function submit(stage: any, resetForm: any){
        db.stages.add(stage)
        resetForm()
    }

    return <>
        <StageForm onSubmit={submit} />
        <button onClick={() => router.push("../stages")}>Retour</button>
    </>
    
}