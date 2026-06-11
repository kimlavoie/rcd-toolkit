'use client'

import { useAuth } from "@/app/utilities/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DbLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (user.role === 'ENSEIGNANT') {
                router.push("/")
            }
        }
    }, [user, loading, router])

    if (loading) {
        return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>
    }

    if (!user || user.role === 'ENSEIGNANT') {
        return null // Will redirect
    }

    return (
        <>
            {children}
        </>
    )
}
