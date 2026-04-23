'use client'

import ChargeForm from "@/app/admin/components/forms/ChargeForm"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"

export default function(){

    const router = useRouter()
    const params = useParams()

    function submit(charge: any, resetForm: any){
        db.charges.add(charge)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <ChargeForm session={params.session} onSubmit={submit} />
    </>
    
}