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

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch claims to get custom attributes
                const tokenResult = await user.getIdTokenResult();
                const isAdmin = tokenResult.claims.isAdmin as boolean | undefined;
                
                // Fallback for old claims during migration
                const oldRole = tokenResult.claims.role as string | undefined;
                const oldDeptId = tokenResult.claims.departementId as string | undefined;
                
                const isGlobalAdmin = isAdmin === true || oldRole === 'ADMIN';

                // Get active department from localStorage (since this hook runs outside of the useAuth context directly)
                const activeDepartementId = typeof window !== 'undefined' ? localStorage.getItem('activeDepartementId') : null;
                const targetDeptId = activeDepartementId || oldDeptId;

                let dynamicConstraints: QueryConstraint[] = [];
                if (collectionName !== 'departements' && targetDeptId && !isGlobalAdmin) {
                    if (collectionName === 'enseignants') {
                        dynamicConstraints.push(where(`departements.${targetDeptId}`, "in", ["COORDONNATEUR", "ENSEIGNANT", "ADMIN"]));
                    } else {
                        dynamicConstraints.push(where("departementId", "==", targetDeptId));
                    }
                }

                const q = query(
                    collection(firestore, collectionName),
                    ...dynamicConstraints,
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
