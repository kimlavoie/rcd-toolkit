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
    isAdmin?: boolean;
    isActualAdmin?: boolean; // True if they have the claim, regardless of current UI mode
    departements?: Record<string, string>;
    mustChangePassword?: boolean;
    // Helper fields for current context
    role?: string; 
    departementId?: string | null;
}

export function useAuth() {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Active department state (persisted locally)
    const [activeDepartementId, setActiveDepartementIdState] = useState<string | null>(null);

    const setActiveDepartementId = (id: string | null) => {
        if (typeof window !== 'undefined') {
            if (id) {
                localStorage.setItem('activeDepartementId', id);
            } else {
                localStorage.removeItem('activeDepartementId');
            }
        }
        setActiveDepartementIdState(id);
    };

    const toggleSuperAdminMode = (val: boolean) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('superAdminMode', val.toString());
            window.location.reload();
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedDept = localStorage.getItem('activeDepartementId');
            if (savedDept) setActiveDepartementIdState(savedDept);
        }
    }, []);

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
                    
                    const claimIsAdmin = idTokenResult.claims.isAdmin as boolean | undefined;
                    customUser.departements = idTokenResult.claims.departements as Record<string, string> | undefined;
                    customUser.mustChangePassword = idTokenResult.claims.mustChangePassword as boolean | undefined;

                    // Fallback for old claims during migration
                    const oldRole = idTokenResult.claims.role as string | undefined;
                    const oldDeptId = idTokenResult.claims.departementId as string | undefined;
                    
                    if (!customUser.departements && oldDeptId && oldRole !== 'ADMIN') {
                        customUser.departements = { [oldDeptId]: oldRole || 'ENSEIGNANT' };
                    }
                    
                    customUser.isActualAdmin = claimIsAdmin === true || oldRole === 'ADMIN';
                    
                    let superAdminMode = true;
                    if (typeof window !== 'undefined') {
                        superAdminMode = localStorage.getItem('superAdminMode') !== 'false';
                    }
                    customUser.isAdmin = customUser.isActualAdmin && superAdminMode;

                    // Determine active department based on saved state or defaults
                    let currentActiveDept = activeDepartementId;
                    if (!currentActiveDept && typeof window !== 'undefined') {
                        currentActiveDept = localStorage.getItem('activeDepartementId');
                    }

                    const availableDepts = customUser.departements ? Object.keys(customUser.departements) : [];

                    if (!currentActiveDept || (!availableDepts.includes(currentActiveDept) && !customUser.isAdmin)) {
                         // Invalid or no active dept. Auto-select first available if not global admin
                         currentActiveDept = availableDepts.length > 0 ? availableDepts[0] : null;
                         if (currentActiveDept) {
                             setActiveDepartementId(currentActiveDept);
                         }
                    }

                    // Set computed context fields
                    customUser.departementId = currentActiveDept;
                    if (customUser.isAdmin) {
                        customUser.role = 'ADMIN';
                    } else if (currentActiveDept && customUser.departements) {
                        customUser.role = customUser.departements[currentActiveDept];
                    } else {
                        customUser.role = 'ENSEIGNANT';
                    }

                    setUser(customUser);
                } catch (error) {
                    console.error("Error fetching custom claims", error);
                    setUser(firebaseUser); // Fallback without claims
                }
            } else {
                setUser(null);
                setActiveDepartementId(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [activeDepartementId]);

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
            setActiveDepartementId(null);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const refreshUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            const idTokenResult = await auth.currentUser.getIdTokenResult(true);
            const customUser = auth.currentUser as CustomUser;
            customUser.isAdmin = idTokenResult.claims.isAdmin as boolean | undefined;
            customUser.departements = idTokenResult.claims.departements as Record<string, string> | undefined;
            customUser.mustChangePassword = idTokenResult.claims.mustChangePassword as boolean | undefined;
            
            let currentActiveDept = activeDepartementId;
            if (!currentActiveDept && typeof window !== 'undefined') {
                currentActiveDept = localStorage.getItem('activeDepartementId');
            }
            const availableDepts = customUser.departements ? Object.keys(customUser.departements) : [];
            if (!currentActiveDept || (!availableDepts.includes(currentActiveDept) && !customUser.isAdmin)) {
                 currentActiveDept = availableDepts.length > 0 ? availableDepts[0] : null;
                 if (currentActiveDept) setActiveDepartementId(currentActiveDept);
            }
            customUser.departementId = currentActiveDept;
            if (customUser.isAdmin) {
                customUser.role = 'ADMIN';
            } else if (currentActiveDept && customUser.departements) {
                customUser.role = customUser.departements[currentActiveDept];
            } else {
                customUser.role = 'ENSEIGNANT';
            }

            setUser(null); // Force a re-render/re-set
            setTimeout(() => setUser(customUser), 10);
        }
    }

    return { user, loading, signInWithGoogle, registerWithEmail, loginWithEmail, logout, refreshUser, changePassword, activeDepartementId, setActiveDepartementId, toggleSuperAdminMode };
}
