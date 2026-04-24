'use client'
import { useParams } from "next/navigation"
import Tache from "./Tache"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import Summary from "./Summary"

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

    return <>
    <div style={{width: "100%"}}>
        <table className="table table-bordered">
            <tbody>
                <Tache session={sessions[0]} />
                <Tache session={sessions[1]} />
                <Summary sessions={sessions} />
            </tbody>
        </table>
    </div>
    </>
}