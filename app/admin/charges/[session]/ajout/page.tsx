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
        <ChargeForm session={params.session} onSubmit={submit} />
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}