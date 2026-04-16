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
        <StageForm id={params.id} onSubmit={submit} />
        <button onClick={() => router.push("../stages")}>Retour</button>
    </>
    
}