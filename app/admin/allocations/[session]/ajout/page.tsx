'use client'

import AllocationForm from "@/app/admin/components/forms/AllocationForm"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"

export default function(){

    const router = useRouter()
    const params = useParams()

    function submit(allocation: any, resetForm: any){
        db.allocations.add(allocation)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <AllocationForm session={params.session} onSubmit={submit} />
    </>
    
}