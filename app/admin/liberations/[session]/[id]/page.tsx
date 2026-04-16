'use client'

import LiberationForm from "@/app/admin/components/forms/LiberationForm";
import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(liberation: any){
        const {id, ...rest} = liberation
        db.liberations.update(Number(id), rest)
        router.push(`../${params.session}`)
    }

    return <>
        <LiberationForm session={params.session} id={params.id} onSubmit={submit} />
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}