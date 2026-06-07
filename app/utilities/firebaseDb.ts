import { 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query,
    where,
    getDoc,
    QueryConstraint
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { firestore, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Schemas } from "@/app/db/schemas";
import { toast } from "react-hot-toast";
import { z } from "zod";

export function useFirestoreCollection<T>(collectionName: string, extraConstraints: QueryConstraint[] = []) {
    const [data, setData] = useState<T[] | undefined>(undefined);

    useEffect(() => {
        // Support for Cypress mock data
        const mockData = typeof window !== 'undefined' ? localStorage.getItem(`cypress-db-${collectionName}`) : null;
        if (mockData) {
            setData(JSON.parse(mockData));
            return;
        }

        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(firestore, collectionName),
                    where("userId", "==", user.uid),
                    ...extraConstraints
                );
                
                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as T[];
                    setData(items);
                }, (error) => {
                    console.error(`Snapshot error for ${collectionName}:`, error);
                });
            } else {
                if (unsubscribeSnapshot) {
                    unsubscribeSnapshot();
                    unsubscribeSnapshot = undefined;
                }
                setData(undefined);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, [collectionName, extraConstraints]);

    return data;
}

export const firebaseDb = {
    enseignants: createFirebaseTable("enseignants"),
    cours: createFirebaseTable("cours"),
    groupes: createFirebaseTable("groupes"),
    allocations: createFirebaseTable("allocations"),
    liberations: createFirebaseTable("liberations"),
    stages: createFirebaseTable("stages"),
    supervisions: createFirebaseTable("supervisions"),
    charges: createFirebaseTable("charges"),
    CIReelles: createFirebaseTable("CIReelles"),
    scenarios: createFirebaseTable("scenarios"),
};

function createFirebaseTable(collectionName: string) {
    const schema = Schemas[collectionName];

    return {
        toArray: () => {
             throw new Error("Use useFirestoreCollection hook for reactive data");
        },
        add: async (data: any) => {
            try {
                const userId = auth.currentUser?.uid;
                if (!userId) throw new Error("User must be logged in to add data");
                
                const { id, ...rest } = data;

                // Validation
                if (schema) {
                    const result = schema.safeParse(rest);
                    if (!result.success) {
                        const errorMsg = result.error.issues.map(e => e.message).join(", ");
                        toast.error(`Erreur de validation: ${errorMsg}`);
                        throw new Error(`Validation failed for ${collectionName}: ${errorMsg}`);
                    }
                }
                
                // Automatically inject userId for isolation
                return await addDoc(collection(firestore, collectionName), {
                    ...rest,
                    userId
                });
            } catch (error) {
                console.error(`Error adding to ${collectionName}:`, error);
                throw error;
            }
        },
        update: async (id: string, data: any) => {
            try {
                const userId = auth.currentUser?.uid;
                if (!userId) throw new Error("User must be logged in to update data");

                const docRef = doc(firestore, collectionName, id);
                
                // Safety check: ensure the document belongs to the user
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().userId !== userId) {
                    throw new Error("Unauthorized: You do not own this document");
                }

                const { id: _, userId: __, ...rest } = data;

                // Validation (Partial update support)
                if (schema instanceof z.ZodObject) {
                    const result = schema.partial().safeParse(rest);
                    if (!result.success) {
                        const errorMsg = result.error.issues.map(e => e.message).join(", ");
                        toast.error(`Erreur de validation: ${errorMsg}`);
                        throw new Error(`Validation failed for ${collectionName}: ${errorMsg}`);
                    }
                } else if (schema) {
                    // Fallback for non-object schemas (less likely in this DB structure)
                    const result = schema.safeParse(rest);
                    if (!result.success) {
                        const errorMsg = result.error.issues.map(e => e.message).join(", ");
                        toast.error(`Erreur de validation: ${errorMsg}`);
                        throw new Error(`Validation failed for ${collectionName}: ${errorMsg}`);
                    }
                }

                return await updateDoc(docRef, {
                    ...rest,
                    userId // Ensure userId is preserved/updated
                });
            } catch (error) {
                console.error(`Error updating in ${collectionName}:`, error);
                throw error;
            }
        },
        delete: async (id: string) => {
            try {
                const userId = auth.currentUser?.uid;
                if (!userId) throw new Error("User must be logged in to delete data");

                const docRef = doc(firestore, collectionName, id);

                // Safety check: ensure the document belongs to the user
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().userId !== userId) {
                    throw new Error("Unauthorized: You do not own this document");
                }

                return await deleteDoc(docRef);
            } catch (error) {
                console.error(`Error deleting from ${collectionName}:`, error);
                throw error;
            }
        },
        get: async (id: string) => {
            // Placeholder
        }
    };
}
