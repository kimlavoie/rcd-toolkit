'use client'

import Link from "next/link"

export default function(){
    return <>
        <Link href="admin/enseignants">Modifier les enseignants</Link>
        <Link href="admin/cours">Modifier les cours</Link>
    </>
}