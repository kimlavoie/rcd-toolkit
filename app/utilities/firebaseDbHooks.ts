import { 
    collection, 
    onSnapshot, 
    query,
    where,
    QueryConstraint
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { firestore, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useFirestoreCollection<T>(collectionName: string, extraConstraints: QueryConstraint[] = []) {
    const [data, setData] = useState<T[] | undefined>(undefined);

    useEffect(() => {
        const loadMock = () => {
            const mockData = typeof window !== 'undefined' ? localStorage.getItem(`cypress-db-${collectionName}`) : null;
            if (mockData) {
                setData(JSON.parse(mockData));
                return true;
            }
            return false;
        };

        if (loadMock()) {
            const handleMockChange = (e: any) => {
                if (e.detail.collection === collectionName) {
                    loadMock();
                }
            };
            window.addEventListener('cypress-db-changed', handleMockChange);
            return () => window.removeEventListener('cypress-db-changed', handleMockChange);
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
