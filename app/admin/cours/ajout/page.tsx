'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import CoursForm from "../../components/forms/CoursForm"

export default function(){

    const router = useRouter()

    function submit(cours: any, resetForm: any){
        db.cours.add(cours)
        resetForm()
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <CoursForm onSubmit={submit} />
    </>
    
}