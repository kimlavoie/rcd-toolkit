'use client'

import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import PrioriteForm from "../../components/forms/PrioriteForm"

export default function(){
    const router = useRouter()
    
    function submit(priorite: any, resetForm: any){
        db.priorites.add(priorite)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <PrioriteForm onSubmit={submit} />
    </>
    
}