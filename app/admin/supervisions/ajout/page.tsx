'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import SupervisionForm from "../../components/forms/SupervisionForm"

export default function(){

    const router = useRouter()

    function submit(supervision: any, resetForm: any){
        db.supervisions.add(supervision)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <SupervisionForm onSubmit={submit} />
    </>
    
}