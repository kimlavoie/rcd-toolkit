import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc
} from "firebase/firestore";
import { firestore, auth } from "@/app/utilities/firebase";
import { Schemas } from "@/app/db/schemas";
import { toast } from "react-hot-toast";
import { z } from "zod";

export class BaseService<T> {
    protected collectionName: string;
    protected schema: any;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
        this.schema = Schemas[collectionName];
    }

    protected getUserId() {
        if (typeof window !== 'undefined') {
            const mockUser = localStorage.getItem('cypress-user');
            if (mockUser) return JSON.parse(mockUser).uid;
        }
        return auth.currentUser?.uid;
    }

    protected isMock() {
        return typeof window !== 'undefined' && localStorage.getItem(`cypress-db-${this.collectionName}`) !== null;
    }

    async add(data: any): Promise<{ id: string }> {
        if (this.isMock()) {
            const id = "mock-" + Math.random().toString(36).substr(2, 9);
            const current = JSON.parse(localStorage.getItem(`cypress-db-${this.collectionName}`) || '[]');
            const newData = { ...data, id, userId: this.getUserId() };
            current.push(newData);
            localStorage.setItem(`cypress-db-${this.collectionName}`, JSON.stringify(current));
            window.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: this.collectionName } }));
            return { id };
        }
        
        const userId = this.getUserId();
        if (!userId) throw new Error("User must be logged in");
        
        const { id, ...rest } = data;

        if (this.schema) {
            const result = this.schema.safeParse(rest);
            if (!result.success) {
                const errorMsg = result.error.issues.map((e: any) => e.message).join(", ");
                toast.error(`Erreur: ${errorMsg}`);
                throw new Error(errorMsg);
            }
        }

        const docRef = await addDoc(collection(firestore, this.collectionName), {
            ...rest,
            userId
        });
        return { id: docRef.id };
    }

    async update(id: string, data: any): Promise<void> {
        if (this.isMock()) {
            const current = JSON.parse(localStorage.getItem(`cypress-db-${this.collectionName}`) || '[]');
            const index = current.findIndex((item: any) => item.id === id);
            if (index !== -1) {
                current[index] = { ...current[index], ...data };
                localStorage.setItem(`cypress-db-${this.collectionName}`, JSON.stringify(current));
                window.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: this.collectionName } }));
            }
            return;
        }

        const userId = this.getUserId();
        if (!userId) throw new Error("User must be logged in");

        const docRef = doc(firestore, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().userId !== userId) {
            throw new Error("Unauthorized");
        }

        const { id: _, userId: __, ...rest } = data;

        if (this.schema instanceof z.ZodObject) {
            const result = this.schema.partial().safeParse(rest);
            if (!result.success) {
                const errorMsg = result.error.issues.map((e: any) => e.message).join(", ");
                toast.error(`Erreur: ${errorMsg}`);
                throw new Error(errorMsg);
            }
        }

        await updateDoc(docRef, { ...rest, userId });
    }

    async delete(id: string): Promise<void> {
        if (this.isMock()) {
            const current = JSON.parse(localStorage.getItem(`cypress-db-${this.collectionName}`) || '[]');
            const filtered = current.filter((item: any) => item.id !== id);
            localStorage.setItem(`cypress-db-${this.collectionName}`, JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: this.collectionName } }));
            return;
        }

        const userId = this.getUserId();
        if (!userId) throw new Error("User must be logged in");

        const docRef = doc(firestore, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().userId !== userId) {
            throw new Error("Unauthorized");
        }

        await deleteDoc(docRef);
    }
}
