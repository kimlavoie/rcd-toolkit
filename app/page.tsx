'use client'

import Link from "next/link";
import { useAuth } from "./utilities/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) return <div className="container mt-5 text-center">Chargement...</div>
  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container mt-5">
      <h1>RCD Toolkit</h1>
      <p>Bienvenue, {user.displayName}</p>
      <hr />
      <div className="list-group mb-4">
        <Link href="admin" className="list-group-item list-group-item-action">Section d'administration</Link>
        <Link href="taches" className="list-group-item list-group-item-action">Section des tâches</Link>
        <Link href="db" className="list-group-item list-group-item-action">Gérer les données</Link>
      </div>
      <button className="btn btn-outline-danger" onClick={logout}>Déconnexion</button>
    </div>
  );
}
