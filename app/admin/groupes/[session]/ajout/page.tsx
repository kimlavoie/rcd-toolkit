'use client'

import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import GroupeForm from "@/app/admin/components/forms/GroupeForm"

export default function(){
    const router = useRouter()
    const params = useParams()
    
    function submit(groupe: any, resetForm: any){
        db.groupes.add(groupe)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <GroupeForm onSubmit={submit} session={params.session} />
    </>
    
}