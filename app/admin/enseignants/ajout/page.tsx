'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import EnseignantForm from "../../components/forms/EnseignantForm"

export default function(){

    const router = useRouter()

    function submit(enseignant: any, resetForm: any){
        db.enseignants.add(enseignant)
        resetForm()
    }

    return <>
        <EnseignantForm enseignant={{}} onSubmit={submit} />
        <button onClick={() => router.push("../enseignants")}>Retour</button>
    </>
    
}