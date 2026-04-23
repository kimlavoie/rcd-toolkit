'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import EnseignantForm from "../../components/forms/EnseignantForm"

export default function(){

    const router = useRouter()

    function submit(enseignant: any, resetForm: any){
        db.enseignants.add(enseignant)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <EnseignantForm onSubmit={submit} />
    </>
    
}