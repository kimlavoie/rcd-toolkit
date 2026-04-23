import Link from "next/link";

export default function(){
    return <>
        <p><Link href="db/import">Importer des données</Link></p>
        <p><Link href="db/export">Exporter des données</Link></p>
    </>
}