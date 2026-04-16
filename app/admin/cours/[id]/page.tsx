'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import CoursForm from "../../components/forms/CoursForm";

export default function(){
    const params = useParams()
    const router = useRouter()

    function submit(cours: any){
        const {id, ...rest} = cours
        db.cours.update(Number(id), rest)
        router.push("../cours")
    }

    return <>
        <CoursForm id={params.id} onSubmit={submit} />
        <button onClick={() => router.push("../cours")}>Retour</button>
    </>
}