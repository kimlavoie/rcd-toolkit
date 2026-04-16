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
        <GroupeForm id={params.id} onSubmit={submit} session={params.session} />
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}