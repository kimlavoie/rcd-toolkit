'use client'

import AllocationForm from "@/app/admin/components/forms/AllocationForm";
import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(allocation: any){
        const {id, ...rest} = allocation
        db.allocations.update(Number(id), rest)
        router.push(`../${params.session}`)
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <AllocationForm session={params.session} id={params.id} onSubmit={submit} />
    </>
    
}