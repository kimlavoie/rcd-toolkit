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
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <StageForm onSubmit={submit} />
    </>
    
}