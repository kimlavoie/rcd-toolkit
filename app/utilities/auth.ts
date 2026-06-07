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
    updateProfile
} from "firebase/auth";
import { auth } from "./firebase";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Support for Cypress mock user
        const mockUser = typeof window !== 'undefined' ? localStorage.getItem('cypress-user') : null;
        if (mockUser) {
            setUser(JSON.parse(mockUser));
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
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

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return { user, loading, signInWithGoogle, registerWithEmail, loginWithEmail, logout };
}
