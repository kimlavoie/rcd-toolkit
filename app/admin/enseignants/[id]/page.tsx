'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import EnseignantForm from "../../components/forms/EnseignantForm";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(enseignant: any){
        const {id, ...rest} = enseignant
        db.enseignants.update(Number(id), rest)
        router.push("../enseignants")
    }

    return <>
        <EnseignantForm id={params.id} onSubmit={submit} />
        <button onClick={() => router.push("../enseignants")}>Retour</button>
    </>
    
}