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
        <CoursForm onSubmit={submit} />
        <button onClick={() => router.push("../cours")}>Retour</button>
    </>
    
}