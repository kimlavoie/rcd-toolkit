'use client'

import LiberationForm from "@/app/admin/components/forms/LiberationForm"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"

export default function(){

    const router = useRouter()
    const params = useParams()

    function submit(liberation: any, resetForm: any){
        db.liberations.add(liberation)
        resetForm()
    }

    return <>
        <LiberationForm session={params.session} onSubmit={submit} />
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}