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
        <GroupeForm onSubmit={submit} session={params.session} />
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}