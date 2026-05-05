'use client'

import SelectSession from "@/app/admin/components/inputs/SelectSession";
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions";
import Link from "next/link";
import { useState } from "react";
import { db } from "../db";

export default function(){
    const [sessionDepart, setSessionDepart] = useState("A26")
    const [annee, setAnnee] = useState(2026)

    async function copy(){
        const sessionArrivee = makeSessionCode(extractSessionInfos(sessionDepart).saison, String(annee))

        if(sessionDepart == sessionArrivee){
            alert("Les deux sessions doivent être différentes")
            return
        }

        const groupes = await db.groupes.toArray()
        const allocations = await db.allocations.toArray()
        const stages = await db.stages.toArray()
        const charges = await db.charges.toArray()
        const liberations = await db.liberations.toArray()
        const supervisions = await db.supervisions.toArray()

        //Suppression (au cas)
        groupes.filter(groupe => groupe.session == sessionArrivee).forEach(groupe => {
            charges.filter(charge => charge.groupe == groupe.id).forEach(charge => db.charges.delete(charge.id))
            db.groupes.delete(groupe.id)
        })
        allocations.filter(allocation => allocation.session == sessionArrivee).forEach(allocation => {
            liberations.filter(liberation => liberation.allocation == allocation.id).forEach(liberation => db.liberations.delete(liberation.id))
            db.allocations.delete(allocation.id)
        })
        stages.filter(stage => stage.session == sessionArrivee).forEach(stage => {
            supervisions.filter(supervision => supervision.stage == stage.id).forEach(supervision => db.supervisions.delete(supervision.id))
            db.stages.delete(stage.id)
        })

        //Copie
        groupes.filter(groupe => groupe.session == sessionDepart).forEach(async groupe => {
            const {id, ...anonGroupe} = groupe
            const newId = await db.groupes.add({...anonGroupe, session: sessionArrivee})
            charges.filter(charge => charge.groupe == groupe.id).forEach(charge => {
                const {id, ...anonCharge} = charge
                db.charges.add({...anonCharge, groupe: newId})
            })
        })
        allocations.filter(allocation => allocation.session == sessionDepart).forEach(async allocation => {
            const {id, ...anonAllocation} = allocation
            const newId = await db.allocations.add({...anonAllocation, session: sessionArrivee})
            liberations.filter(liberation => liberation.allocation == allocation.id).forEach(liberation => {
                const {id, ...anonLiberation} = liberation
                db.liberations.add({...anonLiberation, allocation: newId})
            })
        })
        stages.filter(stage => stage.session == sessionDepart).forEach(async stage => {
            const {id, ...anonStage} = stage
            const newId = await db.stages.add({...anonStage, session: sessionArrivee})
            supervisions.filter(supervision => supervision.stage == stage.id).forEach(supervision => {
                const {id, ...anonSupervision} = supervision
                db.supervisions.add({...anonSupervision, stage: newId})
            })
        })

        alert("Copie effectuée")
    }
    return <>
        <p><SelectSession code={sessionDepart} onChange={setSessionDepart} /></p>
        <p>Copier pour l'année <input type="number" min="2000" name="annee" value={annee} onChange={(ev) => setAnnee(Number(ev.target.value))} /></p>
        <p><button onClick={copy}>Copier les données</button></p>
        <p><Link href="/">Retour à l'accueil</Link></p>
    </>}