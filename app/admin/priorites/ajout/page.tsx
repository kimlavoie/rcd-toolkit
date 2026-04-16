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
        <PrioriteForm onSubmit={submit} />
        <button onClick={() => router.push(`../priorites`)}>Retour</button>
    </>
    
}