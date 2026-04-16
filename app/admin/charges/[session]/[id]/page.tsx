'use client'

import ChargeForm from "@/app/admin/components/forms/ChargeForm";
import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(charge: any){
        const {id, ...rest} = charge
        db.charges.update(Number(id), rest)
        router.push(`../${params.session}`)
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <ChargeForm session={params.session} id={params.id} onSubmit={submit} />
    </>
    
}