'use client'

import { useState, useEffect } from "react";
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut, 
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    updatePassword
} from "firebase/auth";
import { auth } from "./firebase";

export interface CustomUser extends User {
    role?: string;
    departementId?: string | null;
    mustChangePassword?: boolean;
}

export function useAuth() {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Support for Cypress mock user
        const mockUser = typeof window !== 'undefined' ? localStorage.getItem('cypress-user') : null;
        if (mockUser) {
            setUser(JSON.parse(mockUser));
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Force token refresh to get latest custom claims (important after role updates)
                    const idTokenResult = await firebaseUser.getIdTokenResult(true);
                    const customUser = firebaseUser as CustomUser;
                    customUser.role = idTokenResult.claims.role as string | undefined;
                    customUser.departementId = idTokenResult.claims.departementId as string | null | undefined;
                    customUser.mustChangePassword = idTokenResult.claims.mustChangePassword as boolean | undefined;
                    setUser(customUser);
                } catch (error) {
                    console.error("Error fetching custom claims", error);
                    setUser(firebaseUser); // Fallback without claims
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, pass: string, name: string) => {
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(res.user, { displayName: name });
            return res.user;
        } catch (error) {
            console.error("Registration Error:", error);
            throw error;
        }
    }

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            const res = await signInWithEmailAndPassword(auth, email, pass);
            return res.user;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    }

    const changePassword = async (newPassword: string) => {
        if (!auth.currentUser) throw new Error("Aucun utilisateur connecté");
        try {
            await updatePassword(auth.currentUser, newPassword);
        } catch (error) {
            console.error("Change Password Error:", error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const refreshUser = async () => {
        if (auth.currentUser) {
            const idTokenResult = await auth.currentUser.getIdTokenResult(true);
            const customUser = auth.currentUser as CustomUser;
            customUser.role = idTokenResult.claims.role as string | undefined;
            customUser.departementId = idTokenResult.claims.departementId as string | null | undefined;
            setUser(null); // Force a re-render/re-set
            setTimeout(() => setUser(customUser), 10);
        }
    }

    return { user, loading, signInWithGoogle, registerWithEmail, loginWithEmail, logout, refreshUser, changePassword };
}
