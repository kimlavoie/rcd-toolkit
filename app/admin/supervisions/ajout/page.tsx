'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import SupervisionForm from "../../components/forms/SupervisionForm"

export default function(){

    const router = useRouter()

    function submit(supervision: any, resetForm: any){
        db.supervisions.add(supervision)
        resetForm()
    }

    return <>
        <SupervisionForm onSubmit={submit} />
        <button onClick={() => router.push("../supervisions")}>Retour</button>
    </>
    
}