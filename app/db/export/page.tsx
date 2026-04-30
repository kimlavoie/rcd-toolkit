'use client'

import Link from "next/link"
import { db } from "../db"

async function pumpDB(){
    const allData: any = {};
  
  // Iterate through each table defined in the Dexie instance
    await Promise.all(db.tables.map(async table => {
        allData[table.name] = await table.toArray();
    }));

  return allData;
}

async function download(){
    const datetime = new Date().toISOString().split('.')[0]

    const data = await pumpDB()
    const json = JSON.stringify(data)
    const blob = new Blob([json], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = datetime + ".json"
    link.click()

    URL.revokeObjectURL(url)
}

export default function(){    
    return <>
        <p><button onClick={download}>Télécharger les données</button></p>
        <p><Link href="/">Retour à l'accueil</Link></p>
    </>
}