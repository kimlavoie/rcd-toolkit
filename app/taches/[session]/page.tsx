'use client'
import { useParams } from "next/navigation"
import Tache from "./Tache"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"

export default function(){
    const params = useParams()
    const session = params.session
    const {saison, annee} = extractSessionInfos(String(session))
    let sessions = []

    if(saison == "Automne"){
        sessions = [session, makeSessionCode("Hiver", String(Number(annee)+1))]
    } else{
        sessions = [makeSessionCode("Automne", String(Number(annee)-1)),session]
    }

    console.log(sessions)

    return <>
        <Tache session={sessions[0]} />
        <Tache session={sessions[1]} />
    </>
}