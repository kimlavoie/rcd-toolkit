'use client'

import GroupeForm from "@/app/admin/components/forms/GroupeForm";
import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(groupe: any){
        const {id, ...rest} = groupe
        db.groupes.update(Number(id), rest)
        router.push(`../${params.session}`)
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill" onClick={() => router.push(".")}>←</button>  
        <GroupeForm id={params.id} onSubmit={submit} session={params.session} />
    </>
    
}