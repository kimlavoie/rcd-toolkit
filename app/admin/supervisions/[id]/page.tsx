'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import SupervisionForm from "../../components/forms/SupervisionForm";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(supervision: any){
        const {id, ...rest} = supervision
        db.supervisions.update(Number(id), rest)
        router.push("../supervisions")
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <SupervisionForm id={params.id} onSubmit={submit} />
    </>
    
}