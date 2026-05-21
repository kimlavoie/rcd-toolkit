import { 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query 
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { firestore, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useFirestoreCollection<T>(collectionName: string) {
    const [data, setData] = useState<T[] | undefined>(undefined);

    useEffect(() => {
        // Wait for auth to be initialized and user to be logged in
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(collection(firestore, collectionName));
                const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as T[];
                    setData(items);
                }, (error) => {
                    console.error(`Snapshot error for ${collectionName}:`, error);
                });

                return () => unsubscribeSnapshot();
            } else {
                setData(undefined);
            }
        });

        return () => unsubscribeAuth();
    }, [collectionName]);

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
    return {
        toArray: () => {
             throw new Error("Use useFirestoreCollection hook for reactive data");
        },
        add: async (data: any) => {
            try {
                const { id, ...rest } = data;
                return await addDoc(collection(firestore, collectionName), rest);
            } catch (error) {
                console.error(`Error adding to ${collectionName}:`, error);
                throw error;
            }
        },
        update: async (id: string, data: any) => {
            try {
                const { id: _, ...rest } = data;
                const docRef = doc(firestore, collectionName, id);
                return await updateDoc(docRef, rest);
            } catch (error) {
                console.error(`Error updating in ${collectionName}:`, error);
                throw error;
            }
        },
        delete: async (id: string) => {
            try {
                const docRef = doc(firestore, collectionName, id);
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
