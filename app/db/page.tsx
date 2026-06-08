'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../utilities/auth";
import Skeleton from "@/app/utilities/Skeleton";


export default function(){
    const { user, loading } = useAuth()
    const router = useRouter()

    if (loading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )
    if (!user) {
        router.push("/login")
        return null
    }

    return <div className="container mt-3">
        <div className="list-group shadow-sm">
            <Link href="db/import" className="list-group-item list-group-item-action py-3">
                <div className="d-flex w-100 justify-content-between align-items-center">
                    <h5 className="mb-1 text-primary">📥 Importer des données</h5>
                    <small>Upload JSON backup</small>
                </div>
                <p className="mb-1 text-muted small">Restaurer la base de données à partir d'un fichier de sauvegarde.</p>
            </Link>
            <Link href="db/export" className="list-group-item list-group-item-action py-3">
                <div className="d-flex w-100 justify-content-between align-items-center">
                    <h5 className="mb-1 text-success">📤 Exporter des données</h5>
                    <small>Download JSON backup</small>
                </div>
                <p className="mb-1 text-muted small">Télécharger une copie complète de la base de données Firestore.</p>
            </Link>
            <Link href="db/copy" className="list-group-item list-group-item-action py-3">
                <div className="d-flex w-100 justify-content-between align-items-center">
                    <h5 className="mb-1 text-info">👯 Copier une session</h5>
                    <small>Session cloning</small>
                </div>
                <p className="mb-1 text-muted small">Copier les cours, libérations et stages d'une session vers une autre.</p>
            </Link>
        </div>
    </div>
}