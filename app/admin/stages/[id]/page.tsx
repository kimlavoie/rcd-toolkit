'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import StageForm from "../../components/forms/StageForm";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(stage: any){
        const {id, ...rest} = stage
        db.stages.update(Number(id), rest)
        router.push("../stages")
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <StageForm id={params.id} onSubmit={submit} />
    </>
    
}