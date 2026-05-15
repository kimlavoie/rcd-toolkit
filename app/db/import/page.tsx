'use client'

import Link from "next/link";
import { useRef } from "react";
import { db } from "../db";

export default function(){
    const ref = useRef<HTMLInputElement>(null)

    async function upload(){
        try {
            const file = ref.current?.files?.[0]
            if (!file) {
                alert("Veuillez sélectionner un fichier")
                return
            }
            const fileTextContent = await file.text()
            const fileContent = JSON.parse(fileTextContent)

            if (typeof fileContent !== 'object' || fileContent === null || Array.isArray(fileContent)) {
                throw new Error("Format de fichier invalide : le contenu doit être un objet.")
            }

            const validTableNames = db.tables.map(t => t.name)
            const tablesToImport = Object.entries(fileContent)

            // Validation
            for (const [name, content] of tablesToImport) {
                if (!validTableNames.includes(name)) {
                    throw new Error(`Table inconnue détectée dans le fichier : ${name}`)
                }
                if (!Array.isArray(content)) {
                    throw new Error(`Format invalide pour la table ${name} : attendu une liste d'entrées.`)
                }
            }

            // Transactional Import
            await db.transaction('rw', db.tables, async () => {
                for (const [name, content] of tablesToImport) {
                    const table = db.table(name)
                    await table.clear()
                    for (const entry of content) {
                        await table.add(entry)
                    }
                }
            })

            alert("Données chargées avec succès")
        } catch (error: any) {
            console.error("Import error:", error)
            alert("Erreur lors de l'importation : " + (error instanceof Error ? error.message : "Erreur inconnue"))
        }
    }

    return <>
        <p><input type="file" id="fileInput" ref={ref}/></p>
        <p><button onClick={upload}>Charger les données</button></p>
        <p><Link href="/">Retour à l'accueil</Link></p>
    </>
}