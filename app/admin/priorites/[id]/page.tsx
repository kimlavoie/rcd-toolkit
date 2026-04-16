'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import PrioriteForm from "../../components/forms/PrioriteForm";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(priorite: any){
        const {id, ...rest} = priorite
        db.priorites.update(Number(id), rest)
        router.push(`../priorites`)
    }

    return <>
        <PrioriteForm id={params.id} onSubmit={submit} />
        <button onClick={() => router.push(`../priorites`)}>Retour</button>
    </>
    
}