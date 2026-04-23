import Link from "next/link";

export default function Home() {
  return <>
    <p><Link href="admin">Section d'administration</Link></p>
    <p><Link href="taches">Section des tâches</Link></p>
    <p><Link href="calculateur/test">Test de calculateur de CI</Link></p>
    <p><Link href="db">Gérer les données</Link></p>
  </>
}
