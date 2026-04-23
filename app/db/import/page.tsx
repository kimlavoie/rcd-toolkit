'use client'

import Link from "next/link";
import { useRef } from "react";
import { db } from "../db";

export default function(){
    const ref = useRef<HTMLInputElement>(null)

    async function upload(){
        const fileTextContent = await ref.current?.files?.[0].text()
        const fileContent = JSON.parse(fileTextContent!)

        Object.entries(fileContent).forEach(async (table: [string, any]) => {
            const [name, content] = table
            //@ts-ignore
            await db[name].clear()
            content.forEach(async (entry: any) => {
                //@ts-ignore
                await db[name].add(entry)
            })
            
        })
        alert("Données chargées avec succès")
    }

    return <>
        <p><input type="file" id="fileInput" ref={ref}/></p>
        <p><button onClick={upload}>Charger les données</button></p>
        <p><Link href="/">Retour à l'accueil</Link></p>
    </>
}