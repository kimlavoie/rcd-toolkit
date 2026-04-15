'use client'
import { useRouter } from "next/navigation";
import SelectSession from "../components/SelectSession";

export default function(){

    const router = useRouter()
    return <>
        <SelectSession value="0" onChange={(id: any) => router.push(`groupes/${id}`)} />
    </>
}